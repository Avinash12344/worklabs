/**
 * Seed script — creates realistic fake data for WorkLabs development.
 *
 * Run: npm run seed --workspace @worklabs/api
 *
 * Idempotent: uses a fixed email prefix ("seed+") for all seed users.
 * Running it again will DELETE prior seed data and recreate it.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SEED_PREFIX = 'seed+';
const SEED_PASSWORD = 'seedpassword123';

// ============================================================
// Reference data
// ============================================================

const SKILLS = [
  'React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Design', 'Figma',
  'UI/UX', 'Mobile', 'React Native', 'DevOps', 'AWS', 'Python',
  'Content Writing', 'SEO', 'Copywriting',
];

const LOCATIONS = [
  { name: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Bengaluru, Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Delhi, India', lat: 28.6139, lng: 77.2090 },
  { name: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867 },
  { name: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata, West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Ahmedabad, Gujarat', lat: 23.0225, lng: 72.5714 },
];

const JOB_TITLES = [
  'Build a responsive landing page',
  'Redesign our mobile app onboarding',
  'Fix bugs in React dashboard',
  'Design a logo and brand guide',
  'Build REST API for our SaaS',
  'Write 10 SEO blog posts',
  'Migrate legacy app to Next.js',
  'Build a Chrome extension',
  'Create Figma mockups for fintech app',
  'Set up CI/CD pipeline',
  'Build a Shopify custom theme',
  'Data analysis dashboard in Python',
  'Voiceover for product demo',
  'Translate app to Hindi',
  'Design email templates',
  'Build a booking system',
  'Create animated explainer video',
  'Audit website accessibility',
  'Build a Slack bot',
  'Refactor Node.js microservice',
];

const COVER_LETTERS = [
  `Hi, I've built 20+ similar projects. I focus on clean code, accessibility, and speed. Happy to share my portfolio.`,
  `I've been freelancing for 6 years in this exact niche. I can start immediately and deliver in 2 weeks.`,
  `Your requirements match my core skills perfectly. I've led 3 similar projects and can share case studies.`,
  `I noticed you need this done quickly. My process is systematic and I provide daily updates. Let's chat.`,
  `I bring both technical and design thinking to every project. Here's my approach in 3 steps: discovery, build, refine.`,
];

const MESSAGES = [
  'Hi! Excited to work on this with you.',
  'Just reviewed the requirements — a couple of clarifying questions.',
  'Got it. I\'ll start on the first milestone today.',
  'Here\'s a quick update — first draft is ready.',
  'Looks great! Can we tweak the color palette?',
  'Done. Sent over the revised version.',
  'Perfect. Approving the milestone now.',
  'Thanks! On to the next one.',
];

// ============================================================
// Helpers
// ============================================================

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems<T>(arr: T[], count: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, count);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================================
// Cleanup — remove prior seed data
// ============================================================

async function cleanup() {
  console.log('🧹 Cleaning prior seed data…');

  const { data: seedUsers } = await supabase
    .from('users')
    .select('id')
    .like('email', `${SEED_PREFIX}%`);

  const ids = (seedUsers ?? []).map((u) => u.id);
  if (ids.length === 0) {
    console.log('  No prior seed users.');
    return;
  }

  // Cascade delete — everything references users with ON DELETE CASCADE
  await supabase.from('users').delete().in('id', ids);

  // Try to delete auth.users too. Ignore if admin API fails.
  for (const id of ids) {
    try {
      await supabase.auth.admin.deleteUser(id);
    } catch {
      // Silently ignore — auth.users may persist but public.users is gone.
      // On next seed, the email will already exist in auth.users and signUp
      // will return the existing user. That's fine.
    }
  }

  console.log(`  Cleaned ${ids.length} prior seed users.`);
}

// ============================================================
// Create users
// ============================================================

type CreatedUser = { id: string; role: string; fullName: string; email: string };

async function createUsers(): Promise<CreatedUser[]> {
  console.log('👥 Creating users…');

  const usersData: Array<{ name: string; role: 'client' | 'freelancer' | 'admin' }> = [
    { name: 'Rahul Mehta', role: 'client' },
    { name: 'Priya Sharma', role: 'client' },
    { name: 'Vikram Singh', role: 'client' },
    { name: 'Ananya Rao', role: 'client' },
    { name: 'Aditya Kapoor', role: 'freelancer' },
    { name: 'Sneha Patel', role: 'freelancer' },
    { name: 'Karan Verma', role: 'freelancer' },
    { name: 'Meera Iyer', role: 'freelancer' },
    { name: 'Admin User', role: 'admin' },
  ];

  const created: CreatedUser[] = [];

  for (const u of usersData) {
    const slug = u.name.toLowerCase().replace(/\s+/g, '.');
    const email = `${SEED_PREFIX}${slug}@worklabs.dev`;

    // 1. Create auth user via regular signUp (no admin required)
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password: SEED_PASSWORD,
    });
    if (authErr || !authData.user) {
      console.error(`  ✗ Auth failed for ${email}:`, authErr?.message);
      continue;
    }

    // 2. Create public.users row
    const { error: userErr } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      role: u.role,
      full_name: u.name,
    });
    if (userErr) {
      console.error(`  ✗ User insert failed for ${email}:`, userErr.message);
      continue;
    }

    // 3. Create profile
    const hourlyRate = u.role === 'freelancer' ? randomInt(2000, 8000) : null;
    const loc = randomItem(LOCATIONS);

    await supabase.from('profiles').insert({
      user_id: authData.user.id,
      bio: u.role === 'freelancer'
        ? `Experienced ${randomItem(SKILLS)} specialist. I focus on clean, scalable solutions.`
        : null,
      hourly_rate: hourlyRate,
      location: loc.name,
      latitude: loc.lat,
      longitude: loc.lng,
    });

    created.push({
      id: authData.user.id,
      role: u.role,
      fullName: u.name,
      email,
    });
    console.log(`  ✓ ${u.name} (${u.role})`);
  }

  return created;
}


// ============================================================
// Create skills
// ============================================================

async function createSkills(): Promise<Record<string, string>> {
  console.log('🏷️  Creating skills…');

  const map: Record<string, string> = {};
  for (const name of SKILLS) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { data, error } = await supabase
      .from('skills')
      .upsert({ name, slug }, { onConflict: 'name' })
      .select('id, name')
      .single();
    if (!error && data) map[data.name] = data.id;
  }
  console.log(`  ✓ ${Object.keys(map).length} skills`);
  return map;
}

// ============================================================
// Create jobs
// ============================================================

async function createJobs(clients: CreatedUser[], skillMap: Record<string, string>) {
  console.log('💼 Creating jobs…');

  const skillNames = Object.keys(skillMap);
  const jobs: { id: string; clientId: string; title: string }[] = [];

  for (let i = 0; i < 20; i++) {
    const client = randomItem(clients);
    const loc = randomItem(LOCATIONS);
    const budgetMin = randomInt(10000, 50000) * 100;
    const budgetMax = budgetMin + randomInt(5000, 50000) * 100;
    const title = JOB_TITLES[i];

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        client_id: client.id,
        title,
        description: `${title}. Looking for an experienced professional to deliver high-quality work within the agreed timeline. Please share relevant portfolio items with your proposal.`,
        budget_min: budgetMin,
        budget_max: budgetMax,
        status: 'open',
        location: loc.name,
        latitude: loc.lat,
        longitude: loc.lng,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error(`  ✗ Job ${i + 1} failed:`, error?.message);
      continue;
    }

    // Attach 2–4 skills
    const selected = randomItems(skillNames, randomInt(2, 4));
    for (const skillName of selected) {
      await supabase.from('job_skills').insert({
        job_id: data.id,
        skill_id: skillMap[skillName],
      });
    }

    jobs.push({ id: data.id, clientId: client.id, title });
    console.log(`  ✓ "${title}"`);
  }

  return jobs;
}

// ============================================================
// Create proposals
// ============================================================

async function createProposals(freelancers: CreatedUser[], jobs: { id: string; title: string }[]) {
  console.log('📝 Creating proposals…');

  const proposals: { id: string; jobId: string; freelancerId: string; bid: number }[] = [];

  for (const job of jobs) {
    // 2-3 freelancers per job
    const applicants = randomItems(freelancers, randomInt(2, 3));
    for (const f of applicants) {
      const bid = randomInt(15000, 80000) * 100;
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          job_id: job.id,
          freelancer_id: f.id,
          cover_letter: randomItem(COVER_LETTERS),
          bid_amount: bid,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error || !data) continue;
      proposals.push({ id: data.id, jobId: job.id, freelancerId: f.id, bid });
    }
  }

  console.log(`  ✓ ${proposals.length} proposals created`);
  return proposals;
}

// ============================================================
// Create contracts (accept some proposals)
// ============================================================

async function createContracts(
  clients: CreatedUser[],
  jobs: { id: string; clientId: string }[],
  proposals: { id: string; jobId: string; freelancerId: string; bid: number }[]
) {
  console.log('📄 Creating contracts…');

  const contracts: { id: string; clientId: string; freelancerId: string; total: number }[] = [];
  const jobsToAccept = randomItems(jobs, 8);

  for (const job of jobsToAccept) {
    const clientId = job.clientId;
    const matchingProps = proposals.filter((p) => p.jobId === job.id);
    if (matchingProps.length === 0) continue;
    const chosen = randomItem(matchingProps);

    // Insert contract
    const { data, error } = await supabase
      .from('contracts')
      .insert({
        job_id: job.id,
        proposal_id: chosen.id,
        client_id: clientId,
        freelancer_id: chosen.freelancerId,
        total_amount: chosen.bid,
        status: 'active',
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error(`  ✗ Contract failed:`, error?.message);
      continue;
    }

    // Update proposal to accepted
    await supabase.from('proposals').update({ status: 'accepted' }).eq('id', chosen.id);

    // Reject others
    await supabase
      .from('proposals')
      .update({ status: 'rejected' })
      .eq('job_id', job.id)
      .neq('id', chosen.id);

    // Update job to in_progress
    await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', job.id);

    contracts.push({
      id: data.id,
      clientId,
      freelancerId: chosen.freelancerId,
      total: chosen.bid,
    });
    console.log(`  ✓ Contract for job ${job.id.slice(0, 8)}`);
  }

  return contracts;
}

// ============================================================
// Create milestones
// ============================================================

async function createMilestones(contracts: { id: string; total: number }[]) {
  console.log('🎯 Creating milestones…');

  const milestoneTitles = ['Design mockups', 'Initial build', 'Feedback round', 'Final delivery'];
  const statuses = ['pending', 'in_progress', 'submitted', 'approved'] as const;

  for (const c of contracts) {
    // Split into 2-4 milestones
    const count = randomInt(2, 4);
    const amountPer = Math.floor(c.total / count);

    for (let i = 0; i < count; i++) {
      const status = i === 0 ? 'approved' : randomItem([...statuses]);
      await supabase.from('milestones').insert({
        contract_id: c.id,
        title: milestoneTitles[i] ?? `Milestone ${i + 1}`,
        description: `Deliverables for milestone ${i + 1}.`,
        amount: amountPer,
        status,
        order_index: i,
      });
    }
  }

  console.log(`  ✓ Milestones created for ${contracts.length} contracts`);
}

// ============================================================
// Create messages
// ============================================================

async function createMessages(contracts: { id: string; clientId: string; freelancerId: string }[]) {
  console.log('💬 Creating messages…');

  let count = 0;
  for (const c of contracts) {
    // 5-10 messages per contract, alternating between parties
    const msgCount = randomInt(5, 10);
    for (let i = 0; i < msgCount; i++) {
      const senderId = i % 2 === 0 ? c.clientId : c.freelancerId;
      const { error } = await supabase.from('messages').insert({
        contract_id: c.id,
        sender_id: senderId,
        content: randomItem(MESSAGES),
      });
      if (!error) count++;
    }
  }

  console.log(`  ✓ ${count} messages created`);
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('\n🌱 Seeding WorkLabs database…\n');

  await cleanup();
  const users = await createUsers();

  if (users.length === 0) {
    console.error('❌ No users were created. Aborting.');
    process.exit(1);
  }

  const clients = users.filter((u) => u.role === 'client');
  const freelancers = users.filter((u) => u.role === 'freelancer');

  if (clients.length === 0 || freelancers.length === 0) {
    console.error('❌ Need at least one client and one freelancer.');
    process.exit(1);
  }

  const skillMap = await createSkills();

  const jobs = await createJobs(clients, skillMap);
  const proposals = await createProposals(freelancers, jobs);
  const contracts = await createContracts(clients, jobs, proposals);
  await createMilestones(contracts);
  await createMessages(contracts);

  console.log(`\n✅ Seed complete.`);
  console.log(`   Login with any seed user: seed+<name>@worklabs.dev / ${SEED_PASSWORD}\n`);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});