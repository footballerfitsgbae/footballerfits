/**
 * Footballer Fits — seed the four footer info pages into Sanity.
 *
 *   aboutPage        (About)
 *   contactPage      (Contact)
 *   legal-terms      (Terms & Conditions)   — type legalPage
 *   legal-privacy    (Privacy Policy)       — type legalPage
 *
 * This is a TARGETED seed: it only createOrReplaces those four documents, so it
 * can NEVER touch the articles, sections, home or settings the client has edited
 * in the Studio. Content matches the hardcoded fallbacks in src/App.jsx exactly.
 *
 * Token: uses SANITY_WRITE_TOKEN if set, otherwise the Sanity CLI login token
 * (~/.config/sanity/config.json) — so `sanity login` is enough to run it.
 *
 * Usage:
 *   node scripts/seed-info-pages.js            # write
 *   node scripts/seed-info-pages.js --dry-run  # print, don't write
 */

import { createClient } from '@sanity/client'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const DRY_RUN = process.argv.includes('--dry-run')

function resolveToken() {
  if (process.env.SANITY_WRITE_TOKEN) return process.env.SANITY_WRITE_TOKEN
  try {
    const cfgPath = path.join(os.homedir(), '.config', 'sanity', 'config.json')
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
    if (cfg.authToken) return cfg.authToken
  } catch {
    /* fall through */
  }
  return null
}

const token = resolveToken()
if (!token && !DRY_RUN) {
  console.error('\n✖ No write token. Run `sanity login` or set SANITY_WRITE_TOKEN.\n')
  process.exit(1)
}

const client = createClient({
  projectId: 'b5jktpaj',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

/* ══════════════════════════════════════════════════════════════════════════
   CONTENT — verbatim from the fallbacks in src/App.jsx
   ══════════════════════════════════════════════════════════════════════════ */

const ABOUT = {
  _id: 'aboutPage',
  _type: 'aboutPage',
  eyebrow: 'About',
  statement:
    'The game is bigger than ninety minutes. We cover the culture, the fits and the stories that live around it.',
  lead: 'Footballer Fits is an editorial platform built for the way football is actually followed today. Not just results and ratings, but the style, the swagger and the culture the sport moves through.',
  paragraphs: [
    'We started from a simple idea. The way players dress, the music in the tunnel, the shirts fans hunt down and the moments that spill off the pitch are as much a part of the game as the football itself. Those stories rarely get told properly, so we tell them.',
    'Across Fashion, Lifestyle and Entertainment we document the drip, the drops and the personalities shaping the modern game. Some of it is deeply researched. Some of it is simply a great fit worth talking about. All of it comes from a real love of football culture.',
    'We are independent, we are opinionated, and we care about doing it with taste. If it moves the culture forward, it belongs here.',
  ],
  columns: [
    { _type: 'object', title: 'Fashion', description: 'Kits, collabs, sneakers and the fits worth framing.' },
    { _type: 'object', title: 'Lifestyle', description: 'How the game’s biggest names move off the pitch.' },
    { _type: 'object', title: 'Entertainment', description: 'Music, cameos and football’s life in wider culture.' },
  ],
  ctaLabel: 'Get in touch',
}

const CONTACT = {
  _id: 'contactPage',
  _type: 'contactPage',
  eyebrow: 'Contact',
  title: 'Get in touch',
  lead: 'Whether you have a story, a collaboration or just want to say hello, here is how to reach the team.',
  rows: [
    { _type: 'object', label: 'General', description: 'For everything else and general enquiries.', email: 'contact@footballerfits.co.uk' },
    { _type: 'object', label: 'Editorial & Press', description: 'Story tips, features and press requests.', email: 'editorial@footballerfits.co.uk' },
    { _type: 'object', label: 'Partnerships', description: 'Brand, advertising and collaborations.', email: 'partnerships@footballerfits.co.uk' },
  ],
}

/* Legal content in the light { h, body:[{p}|{list}] } authoring shape, then
   converted below to the Sanity legalSection shape. */

const TERMS_SECTIONS = [
  { h: 'Introduction', body: [
    { p: 'These terms and conditions govern your use of the Footballer Fits website. By accessing or using the site you agree to be bound by these terms. If you do not agree with them, please do not use the site.' },
    { p: 'In these terms the words we, us and our refer to Footballer Fits. You refers to anyone who visits or uses the website.' },
  ] },
  { h: 'About us', body: [
    { p: 'Footballer Fits is an online editorial platform covering football culture, style and lifestyle, operated from the United Kingdom. You can contact us at any time at contact@footballerfits.co.uk.' },
  ] },
  { h: 'Using this website', body: [
    { p: 'You may use this website for your own personal, non commercial use. In return, you agree not to:' },
    { list: [
      'Use the site in any way that breaks the law or any applicable regulation.',
      'Copy, reproduce or redistribute our content without our permission.',
      'Attempt to gain unauthorised access to the site, its servers or any connected systems.',
      'Introduce viruses or any other material that is harmful or disruptive.',
      'Use the site in a way that could damage, disable or impair it for others.',
    ] },
    { p: 'We may suspend or withdraw access to the site, or any part of it, at any time and without notice.' },
  ] },
  { h: 'Intellectual property', body: [
    { p: 'Unless stated otherwise, all content on this website, including text, images, graphics, logos and design, is owned by us or our licensors and is protected by copyright and other intellectual property laws. You may not use it for commercial purposes without our written permission.' },
    { p: 'Football club badges, kit designs, brand names and other trademarks featured on the site remain the property of their respective owners and appear for editorial and identification purposes only.' },
  ] },
  { h: 'Content and accuracy', body: [
    { p: 'Our content is provided for general information and entertainment. While we work to keep it accurate and up to date, we make no promises that it is complete, current or free from error, and we may change or remove content at any time.' },
    { p: 'Any opinions expressed are those of the writers and do not constitute professional advice.' },
  ] },
  { h: 'Links to other websites', body: [
    { p: 'This website may contain links to third party websites and embedded content such as social media posts. We do not control those sites and are not responsible for their content, availability or privacy practices. A link does not mean we endorse them.' },
  ] },
  { h: 'Your submissions', body: [
    { p: 'If you send us content, ideas or feedback, you grant us the right to use it without restriction or payment, unless we have agreed otherwise in writing. Please do not send us anything you consider confidential.' },
  ] },
  { h: 'Disclaimers', body: [
    { p: 'The website is provided on an as available basis. To the extent permitted by law, we exclude all warranties, whether express or implied, relating to the site and its content. We do not guarantee that the site will always be available or uninterrupted.' },
  ] },
  { h: 'Limitation of liability', body: [
    { p: 'To the extent permitted by law, we will not be liable for any loss or damage arising from your use of, or inability to use, this website, or from reliance on any content on it. Nothing in these terms limits our liability for death or personal injury caused by negligence, or for fraud, or for anything else that cannot be limited under the law of England and Wales.' },
  ] },
  { h: 'Privacy', body: [
    { p: 'Your use of the website is also governed by our Privacy Policy, which explains how we collect and use your information. Please read it alongside these terms.' },
  ] },
  { h: 'Governing law', body: [
    { p: 'These terms are governed by the law of England and Wales. Any disputes relating to them will be subject to the exclusive jurisdiction of the courts of England and Wales.' },
  ] },
  { h: 'Changes to these terms', body: [
    { p: 'We may update these terms from time to time. When we do, we will change the date at the top of this page. Your continued use of the site after any change means you accept the updated terms.' },
  ] },
  { h: 'Contact us', body: [
    { p: 'If you have any questions about these terms, please email us at contact@footballerfits.co.uk.' },
  ] },
]

const PRIVACY_SECTIONS = [
  { h: 'Who we are', body: [
    { p: 'Footballer Fits is an online editorial platform covering football culture, style and lifestyle. In this policy the words we, us and our refer to Footballer Fits. We are the data controller responsible for the personal information collected through this website.' },
    { p: 'If you have any questions about this policy or about how we handle your information, you can reach us at contact@footballerfits.co.uk.' },
  ] },
  { h: 'The information we collect', body: [
    { p: 'We only collect the information we need to run the website and respond to you. This may include:' },
    { list: [
      'The name and email address you give us when you contact us or sign up for updates.',
      'Technical information such as your device type, browser and how you use the site, collected through cookies and similar tools.',
      'Any details you choose to share with us in a message or email.',
    ] },
    { p: 'We do not ask for sensitive personal information, and you should not send it to us.' },
  ] },
  { h: 'How we use your information', body: [
    { p: 'We use your information to:' },
    { list: [
      'Reply to your messages and enquiries.',
      'Send you updates or newsletters where you have asked to receive them.',
      'Understand how people use the site so we can improve it.',
      'Keep the website secure and working properly.',
    ] },
  ] },
  { h: 'Our lawful basis for using your data', body: [
    { p: 'Under UK data protection law we must have a valid reason to use your personal information. Depending on the situation we rely on:' },
    { list: [
      'Your consent, when we send you marketing or newsletters. You can withdraw this at any time.',
      'Our legitimate interests, to run, protect and improve the website, provided your rights do not override those interests.',
      'A legal obligation, where the law requires us to keep or share certain information.',
    ] },
  ] },
  { h: 'Cookies', body: [
    { p: 'Cookies are small files stored on your device that help the website work and help us understand how it is used. We use essential cookies that the site needs to function, and analytics cookies that help us see which content is popular.' },
    { p: 'You can control or delete cookies through your browser settings at any time. Turning off some cookies may affect how the site works for you.' },
  ] },
  { h: 'Sharing your information', body: [
    { p: 'We do not sell your personal information. We may share it with trusted service providers who help us run the website, such as hosting and analytics providers, and only so they can carry out those services for us.' },
    { p: 'We may also share information where the law requires it, or to protect our rights, safety or property. Any providers we work with must keep your information secure and use it only for the purposes we set.' },
  ] },
  { h: 'How long we keep your information', body: [
    { p: 'We keep your personal information only for as long as we need it for the purposes set out in this policy, or for as long as the law requires. When we no longer need it, we delete it or make it anonymous.' },
  ] },
  { h: 'Storing and transferring your data', body: [
    { p: 'We aim to store your information within the UK or the European Economic Area. If any information is transferred outside these areas, we will make sure appropriate safeguards are in place to protect it, in line with UK data protection law.' },
  ] },
  { h: 'Keeping your information secure', body: [
    { p: 'We take reasonable steps to protect your information from loss, misuse and unauthorised access. No method of sending or storing data online is completely secure, so we cannot promise absolute security, but we work to protect your information at all times.' },
  ] },
  { h: 'Your rights', body: [
    { p: 'Under UK data protection law you have a number of rights over your personal information. You can:' },
    { list: [
      'Ask us for a copy of the information we hold about you.',
      'Ask us to correct information that is wrong or incomplete.',
      'Ask us to delete your information in certain circumstances.',
      'Ask us to limit or stop using your information.',
      'Object to us using your information for certain purposes.',
      'Ask us to move your information to another provider.',
    ] },
    { p: 'To use any of these rights, email us at contact@footballerfits.co.uk. We will respond within one month.' },
  ] },
  { h: 'Children', body: [
    { p: 'This website is not aimed at children under the age of 13, and we do not knowingly collect their information. If you believe a child has given us their details, please contact us and we will remove them.' },
  ] },
  { h: 'Complaints', body: [
    { p: 'If you are unhappy with how we have handled your information, please contact us first so we can try to put things right. You also have the right to complain to the Information Commissioner’s Office, the UK regulator for data protection, at ico.org.uk.' },
  ] },
  { h: 'Changes to this policy', body: [
    { p: 'We may update this policy from time to time. When we do, we will change the date at the top of this page. Please check back regularly so you always know how we protect your information.' },
  ] },
  { h: 'Contact us', body: [
    { p: 'If you have any questions about this privacy policy or about how we use your information, please email us at contact@footballerfits.co.uk.' },
  ] },
]

// { h, body:[{p}|{list}] }  ->  Sanity legalSection
const toSection = (s) => ({
  _type: 'legalSection',
  heading: s.h,
  body: s.body.map((b) =>
    b.list
      ? { _type: 'legalBullets', items: b.list }
      : { _type: 'legalText', text: b.p },
  ),
})

const TERMS = {
  _id: 'legal-terms',
  _type: 'legalPage',
  title: 'Terms & Conditions',
  lastUpdated: '27 July 2026',
  lead: 'These terms set out the rules for using the Footballer Fits website. By using the site you agree to them, so please take a moment to read through.',
  sections: TERMS_SECTIONS.map(toSection),
}

const PRIVACY = {
  _id: 'legal-privacy',
  _type: 'legalPage',
  title: 'Privacy Policy',
  lastUpdated: '22 July 2026',
  lead: 'This policy explains what information Footballer Fits collects, why we collect it, and the choices you have. We keep it as clear and short as we can.',
  sections: PRIVACY_SECTIONS.map(toSection),
}

/* ══════════════════════════════════════════════════════════════════════════
   WRITE
   ══════════════════════════════════════════════════════════════════════════ */

const DOCS = [ABOUT, CONTACT, TERMS, PRIVACY]

async function run() {
  console.log(`\nSeeding ${DOCS.length} info pages${DRY_RUN ? ' (dry run)' : ''}…\n`)
  for (const doc of DOCS) {
    if (DRY_RUN) {
      console.log(`  • ${doc._id} (${doc._type})`)
      continue
    }
    await client.createOrReplace(doc)
    console.log(`  ✓ ${doc._id} (${doc._type})`)
  }
  console.log('\nDone.\n')
}

run().catch((err) => {
  console.error('\n✖ Seed failed:', err.message, '\n')
  process.exit(1)
})
