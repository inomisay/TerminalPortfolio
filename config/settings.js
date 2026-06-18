'use strict';

const CONFIG = {
  name: 'Yasamin',
  handle: 'inomisay',
  title: 'Junior Backend Engineer',
  location: 'Izmir, Turkey',

  // figlet font for the name header in the about section
  // options: Big | Banner3 | Ogre | Puffy | Standard | Star Wars | Stop | Wideterm | Slant | Flower Power
  figletFont: 'Flower Power',

  bio: [
    'Junior Backend Engineer focused on REST APIs, real-time systems,',
    'and database-driven applications using Node.js, Java, and Python.',
    '',
    'Practical experience in machine learning and explainability',
    'for production-focused decision-support systems.',
    '',
    'Comfortable across backend services and AI-related components.',
  ],

  links: [
    { label: 'github', value: 'github.com/inomisay', url: 'https://github.com/inomisay' },
    { label: 'email', value: 'jmvshp@gmail.com', url: 'mailto:jmvshp@gmail.com' },
    { label: 'linkedin', value: 'in/yasamin-valishariatpanahi', url: 'https://linkedin.com/in/yasamin-valishariatpanahi' },
    { label: 'website', value: 'inomisay.vercel.app', url: 'https://inomisay.vercel.app/' },
    { label: 'orcid', value: '0009-0009-6408-8711', url: 'https://orcid.org/0009-0009-6408-8711' },
  ],

  work: [
    {
      name: 'Dokuz Eylul University (ML Intern)',
      duration: '07/2025 - 09/2025',
      year: '2025',
      tech: 'Python · XGBoost · SHAP · Streamlit',
      desc: 'Built NephroCareAI for early AKI/CKD detection with an end-to-end ML pipeline and explainable predictions.',
    },
    {
      name: 'TechMax Technology (Part-Time)',
      duration: '12/2024 - 01/2025',
      year: '2024',
      tech: 'Node.js · MSSQL · REST APIs · Socket.io',
      desc: 'Developed POS backend services, implemented real-time features, and improved inventory/API performance.',
    },
    {
      name: 'Dokuz Eylul University (Hardware Intern)',
      duration: '07/2024 - 07/2024',
      year: '2024',
      tech: 'Arduino · Sensors · Web Interface',
      desc: 'Developed an automated hydroponic system with sensor-driven backend for real-time monitoring and control.',
    },
    {
      name: 'OSF Academy (Full-Stack Intern)',
      duration: '03/2022 - 03/2022',
      year: '2022',
      tech: 'Node.js · Express · MongoDB · JWT · Stripe',
      desc: 'Delivered e-commerce backend features including authentication, payments, and production-grade error monitoring.',
    },
  ],

  projects: [
    {
      name: 'Budget Buddy',
      duration: '05/2026',
      year: '2026',
      tech: 'Personal Finance App · Budgeting',
      desc: 'Completed personal finance planner for budgeting and expense tracking; maintained as features and data needs evolve.',
    },
    {
      name: 'Personal Portfolio Website',
      duration: '07/2023 - 06/2026',
      year: '2023',
      tech: 'Full-Stack Web App',
      desc: 'Completed personal portfolio website; maintained and refreshed as projects, publications, and profile details change.',
    },
    {
      name: 'Library Management System (LMS)',
      duration: '10/2023 - 01/2024',
      year: '2023',
      tech: 'Java · Desktop App',
      desc: 'Role-based desktop application for library operations.',
    },
    {
      name: 'SmartDWC',
      duration: '07/2024 - 08/2024',
      year: '2024',
      tech: 'AI · Hydroponics · Automation',
      desc: 'AI-enhanced automated deep-water culture hydroponic system.',
    },
    {
      name: 'APTility Pro',
      duration: '09/2024 - 05/2026',
      year: '2024',
      tech: 'Full-Stack · Utility Billing',
      desc: 'Completed apartment utility billing and management system; maintained as billing flows and apartment needs change.',
    },
    {
      name: 'NephroCareAI',
      duration: '02/2025 - 06/2026',
      year: '2025',
      tech: 'ML · Clinical Decision Support',
      desc: 'Completed AI-based kidney disease decision support system; maintained with model, interface, and research updates.',
    },
    {
      name: 'CampusMate',
      duration: '09/2025 - 06/2026',
      year: '2025',
      tech: 'LLM · AI Assistant',
      desc: 'AI-powered student assistant project.',
    },
    {
      name: 'AlzheimerDx',
      duration: '09/2025 - 12/2025',
      year: '2025',
      tech: 'Machine Learning',
      desc: 'Machine learning based diagnosis system for Alzheimer\'s disease.',
    },
    {
      name: 'SafeHaven',
      duration: '09/2025 - 12/2025',
      year: '2025',
      tech: 'LLM · Decision Support',
      desc: 'LLM-based decision support system for disaster response.',
    },
  ],

  publications: [
    {
      name: 'Hydroponic OPTICS',
      duration: 'Under Revision',
      year: '2026',
      tech: 'Research Paper',
      desc: 'Research on automated hydroponic monitoring, control, and system optimization.',
    },
    {
      name: 'Prompt Injection in LLM Agents',
      duration: 'Manuscript in Preparation',
      year: '2026',
      tech: 'Security Research',
      desc: 'Analysis of prompt injection risks and defense strategies for LLM-powered systems.',
    },
    {
      name: 'NephroCareAI for Renal Risk Prediction',
      duration: 'Manuscript in Preparation',
      year: '2026',
      tech: 'Medical AI',
      desc: 'Clinical decision-support manuscript focused on kidney disease prediction and interpretation.',
    },
  ],
};

module.exports = { CONFIG };
