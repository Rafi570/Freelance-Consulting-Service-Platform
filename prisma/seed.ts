import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Seed Super Admin (Requested by user)
  const superAdminEmail = 'hasanrafi570@gmail.com';
  const superAdminPassword = await bcrypt.hash('Rafi570@', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      password: superAdminPassword,
    },
    create: {
      name: 'Hasan Rafi (Super Admin)',
      email: superAdminEmail,
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('👑 Super Admin configured:', superAdmin.email, '| Role:', superAdmin.role, '| Status:', superAdmin.status);

  // 1b. Default Platform Super Admin
  const adminEmail = 'superadmin@platform.com';
  let admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'Platform Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Super Admin created:', admin.email);
  } else {
    console.log('ℹ️ Super Admin already exists:', admin.email);
  }

  // 2. Seed Client
  const clientEmail = 'hasan.rafi0123@gmail.com';
  let client = await prisma.user.findUnique({
    where: { email: clientEmail },
  });

  if (!client) {
    client = await prisma.user.create({
      data: {
        name: 'Hasan Rafi',
        email: clientEmail,
        password: hashedPassword,
        role: 'CLIENT',
        status: 'ACTIVE',
      },
    });
    console.log('✅ Client created:', client.email);
  } else {
    console.log('ℹ️ Client already exists:', client.email);
  }

  // 3. Seed Provider
  const providerEmail = 'hasan.provider@gmail.com';
  let provider = await prisma.user.findUnique({
    where: { email: providerEmail },
  });

  if (!provider) {
    provider = await prisma.user.create({
      data: {
        name: 'Hasan Provider',
        email: providerEmail,
        password: hashedPassword,
        role: 'PROVIDER',
        status: 'ACTIVE',
        profile: {
          create: {
            bio: 'Senior Full Stack & Cloud Specialist',
            skills: ['React', 'Node.js', 'PostgreSQL', 'Prisma', 'Docker'],
            hourlyRate: 50,
            phone: '+8801700000001',
            address: 'Dhaka, Bangladesh',
            experience: '5+ years',
            isSubscribed: true,
          },
        },
      },
    });
    console.log('✅ Provider created:', provider.email);
  } else {
    // Ensure profile is marked subscribed
    await prisma.providerProfile.upsert({
      where: { userId: provider.id },
      update: { isSubscribed: true },
      create: {
        userId: provider.id,
        bio: 'Senior Full Stack & Cloud Specialist',
        skills: ['React', 'Node.js', 'PostgreSQL', 'Prisma', 'Docker'],
        hourlyRate: 50,
        isSubscribed: true,
      },
    });
    console.log('ℹ️ Provider already exists:', provider.email);
  }

  // 4. Seed Multi-Category Gigs
  const sampleGigs = [
    {
      category: 'Graphics & Design',
      title: 'Modern Minimalist Brand Identity & Logo Design System',
      description: 'I will design a timeless, minimalist brand identity and vector logo system tailored for tech startups and modern companies.',
      tags: ['Logo Design', 'Branding', 'Vector', 'Minimalist'],
      images: ['https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800'],
      packages: [
        {
          tier: 'BASIC' as const,
          name: 'Starter Logo Concept',
          description: '2 initial logo concepts with high-resolution PNG & vector SVG files.',
          price: 45,
          deliveryTimeInDays: 2,
          revisions: 2,
          features: ['2 Concepts', 'Vector Files', 'Transparent PNG'],
        },
        {
          tier: 'STANDARD' as const,
          name: 'Full Brand Identity',
          description: '4 concepts, complete typography guidelines, color palette, and social kit.',
          price: 120,
          deliveryTimeInDays: 4,
          revisions: 4,
          features: ['4 Concepts', 'Color Palette', 'Brand Guide', 'Social Kit'],
        },
        {
          tier: 'PREMIUM' as const,
          name: 'Executive Brand Suite',
          description: 'Complete corporate identity kit, 3D mockups, stationery, and source files.',
          price: 250,
          deliveryTimeInDays: 7,
          revisions: 99,
          features: ['All Source Files', 'Stationery Kit', '3D Mockups', 'Copyright Transfer'],
        },
      ],
    },
    {
      category: 'Digital Marketing',
      title: 'Targeted Google Ads & Meta Performance Marketing Campaign',
      description: 'Scale your MRR with hyper-targeted paid advertising campaigns across Google Search and Meta Ads Manager with full tracking setup.',
      tags: ['Google Ads', 'Facebook Ads', 'PPC', 'Growth'],
      images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800'],
      packages: [
        {
          tier: 'BASIC' as const,
          name: 'Campaign Audit',
          description: 'Comprehensive audit of current ad setup with 10 actionable growth recommendations.',
          price: 60,
          deliveryTimeInDays: 2,
          revisions: 1,
          features: ['Ad Account Audit', 'Action Plan', 'Targeting Review'],
        },
        {
          tier: 'STANDARD' as const,
          name: 'Campaign Setup & Launch',
          description: 'Complete setup of 2 campaigns with A/B testing, pixel tracking, and copy.',
          price: 180,
          deliveryTimeInDays: 5,
          revisions: 3,
          features: ['2 Ad Campaigns', 'Pixel Integration', 'Conversion Setup', '7 Days Monitoring'],
        },
        {
          tier: 'PREMIUM' as const,
          name: 'Omni-Channel Scale Suite',
          description: 'Google + Meta campaigns, full funnel retargeting, and bi-weekly optimization reports.',
          price: 350,
          deliveryTimeInDays: 14,
          revisions: 5,
          features: ['Omni-Channel Setup', 'Custom Retargeting', 'Bi-weekly Calls', 'ROAS Optimization'],
        },
      ],
    },
    {
      category: 'Video & Animation',
      title: 'Cinematic Product Animation & 3D Explainer Commercial',
      description: 'Engage your target audience with high-retention 3D motion design and kinetic typography video explainers.',
      tags: ['After Effects', '3D Animation', 'Motion Graphics', 'Video Editing'],
      images: ['https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800'],
      packages: [
        {
          tier: 'BASIC' as const,
          name: '15-Sec Teaser',
          description: '15-second animated teaser with background music and sound effects.',
          price: 75,
          deliveryTimeInDays: 3,
          revisions: 2,
          features: ['1080p Full HD', 'Sound FX Included', '15 Seconds Duration'],
        },
        {
          tier: 'STANDARD' as const,
          name: '30-Sec Explainer Video',
          description: '30-second smooth 2D/3D explainer with professional voiceover synchronization.',
          price: 195,
          deliveryTimeInDays: 5,
          revisions: 3,
          features: ['Voiceover Sync', 'Commercial Rights', '4K Rendering', 'Script Editing'],
        },
        {
          tier: 'PREMIUM' as const,
          name: '60-Sec Cinematic Commercial',
          description: 'Full 60-second broadcast quality animation with custom 3D model renderings.',
          price: 450,
          deliveryTimeInDays: 10,
          revisions: 6,
          features: ['Custom 3D Assets', 'Storyboarding', 'Sound Design', 'Source Project Files'],
        },
      ],
    },
    {
      category: 'Writing & Translation',
      title: 'High-Converting B2B Tech Content Writing & SEO Copywriting',
      description: 'Compelling SEO-optimized articles, whitepapers, and landing page copy written by tech industry veterans.',
      tags: ['Content Writing', 'Copywriting', 'SEO', 'Tech Blogs'],
      images: ['https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800'],
      packages: [
        {
          tier: 'BASIC' as const,
          name: '1000-Word SEO Article',
          description: 'Thoroughly researched 1000-word article with keyword density optimization.',
          price: 40,
          deliveryTimeInDays: 2,
          revisions: 2,
          features: ['Keyword Research', 'Plagiarism Free', 'Meta Description Included'],
        },
        {
          tier: 'STANDARD' as const,
          name: '2500-Word In-Depth Guide',
          description: 'Comprehensive pillar guide with custom diagrams and references.',
          price: 95,
          deliveryTimeInDays: 4,
          revisions: 3,
          features: ['Pillar Page Structure', 'Internal Linking Plan', 'Competitor Analysis'],
        },
        {
          tier: 'PREMIUM' as const,
          name: 'Complete Website Copywriting',
          description: 'High-converting copy for 5 core landing pages + email onboarding sequence.',
          price: 220,
          deliveryTimeInDays: 7,
          revisions: 5,
          features: ['5 Core Pages Copy', '3 Email Sequences', 'Conversion Wireframe Suggestions'],
        },
      ],
    },
    {
      category: 'Business & Consulting',
      title: 'Strategic Business Consulting & Financial Forecasting Models',
      description: 'Actionable financial projections, business modeling, and investor-ready pitch deck reviews for fast-growing companies.',
      tags: ['Business Plan', 'Financial Model', 'Startup', 'Pitch Deck'],
      images: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'],
      packages: [
        {
          tier: 'BASIC' as const,
          name: '1-Hour Strategy Session',
          description: 'Direct 1-on-1 consultation covering market positioning and revenue models.',
          price: 80,
          deliveryTimeInDays: 1,
          revisions: 1,
          features: ['60-Min Video Call', 'Summary Notes', 'Recommended Next Steps'],
        },
        {
          tier: 'STANDARD' as const,
          name: '3-Year Financial Model',
          description: 'Dynamic Excel financial model with P&L, Cash Flow, and unit economics.',
          price: 260,
          deliveryTimeInDays: 5,
          revisions: 3,
          features: ['Dynamic Excel Sheet', 'Unit Economics Breakdown', 'Scenario Analysis'],
        },
        {
          tier: 'PREMIUM' as const,
          name: 'Investor-Ready Pitch Deck Suite',
          description: 'Complete 15-slide pitch deck design, financial model, and investor Q&A prep.',
          price: 550,
          deliveryTimeInDays: 10,
          revisions: 5,
          features: ['15 Custom Slides', 'Financial Model Integration', 'Mock Pitch Session'],
        },
      ],
    },
    {
      category: 'AI Services',
      title: 'Custom AI Agent Development, RAG Pipelines & LLM Integration',
      description: 'Build enterprise-grade AI automation workflows, LangChain / LlamaIndex RAG pipelines, and fine-tuned LLM solutions.',
      tags: ['OpenAI', 'LangChain', 'AI Agent', 'Python', 'Vector DB'],
      images: ['https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800'],
      packages: [
        {
          tier: 'BASIC' as const,
          name: 'API Integration POC',
          description: 'Custom OpenAI API integration into your existing backend with streaming response.',
          price: 90,
          deliveryTimeInDays: 2,
          revisions: 2,
          features: ['API Setup', 'Prompt Engineering', 'Streaming Support'],
        },
        {
          tier: 'STANDARD' as const,
          name: 'Knowledge Base RAG Bot',
          description: 'Retrieval-Augmented Generation agent connected to your PDFs and knowledge base with Pinecone.',
          price: 290,
          deliveryTimeInDays: 5,
          revisions: 3,
          features: ['Vector DB Setup', 'Document Chunking', 'Source Citations', 'Docker Ready'],
        },
        {
          tier: 'PREMIUM' as const,
          name: 'Autonomous Multi-Agent Workflow',
          description: 'Multi-agent system with tools, memory, webhook triggers, and monitoring dashboard.',
          price: 650,
          deliveryTimeInDays: 12,
          revisions: 5,
          features: ['Multi-Agent Architecture', 'Tool Calling', 'Persistent Memory', 'Production Deployment'],
        },
      ],
    },
  ];

  for (const item of sampleGigs) {
    const existing = await prisma.gig.findFirst({
      where: {
        category: item.category,
        providerId: provider.id,
      },
    });

    if (!existing) {
      const gig = await prisma.gig.create({
        data: {
          providerId: provider.id,
          title: item.title,
          description: item.description,
          category: item.category,
          tags: item.tags,
          images: item.images,
          status: 'ACTIVE',
        },
      });

      for (const pkg of item.packages) {
        await prisma.gigPackage.create({
          data: {
            gigId: gig.id,
            tier: pkg.tier,
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            deliveryTimeInDays: pkg.deliveryTimeInDays,
            revisions: pkg.revisions,
            features: pkg.features,
          },
        });
      }
      console.log(`✅ Seeded gig for category: "${item.category}"`);
    } else {
      console.log(`ℹ️ Gig already exists for category: "${item.category}"`);
    }
  }

  console.log('\n--- Seed Summary ---');
  console.log('👑 Super Admin: hasanrafi570@gmail.com / Rafi570@');
  console.log('👑 Super Admin: superadmin@platform.com / password123');
  console.log('💼 Provider:    hasan.provider@gmail.com / password123');
  console.log('👤 Client:      hasan.rafi0123@gmail.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
