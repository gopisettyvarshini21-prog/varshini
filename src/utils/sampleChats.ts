import { PlatformId } from '../types';

export interface SampleChatPreset {
  id: string;
  title: string;
  category: 'work' | 'social' | 'personal' | 'academic';
  description: string;
  platform: PlatformId;
  relationship: string;
  purpose: string;
  chatHistory: string;
  latestMessage: string;
  suggestedTones: string[];
}

export const SAMPLE_CHATS: SampleChatPreset[] = [
  {
    id: 'whatsapp-late-apology',
    title: 'Apology & Late Notice',
    category: 'personal',
    description: 'Forgot to notify a close friend about a schedule change before they arrived.',
    platform: 'whatsapp',
    relationship: 'Close friend',
    purpose: 'Acknowledge mistake sincerely without making hollow excuses',
    chatHistory: `[Yesterday 6:15 PM] Alex: Hey are we still on for lunch tomorrow at 12:30?
[Yesterday 6:20 PM] You: Yes absolutely! Looking forward to it!
[Today 11:45 AM] Alex: On my way to the cafe now, got us an outside table 👍
[Today 12:10 PM] You: Hey Alex so sorry something crazy just came up with work, I won't be able to make it today 😔`,
    latestMessage: `Why didn't you tell me earlier? I already drove all the way here.`,
    suggestedTones: ['Polite', 'Empathetic', 'Direct'],
  },
  {
    id: 'workplace-saying-no-boss',
    title: 'Declining Weekend Work Request',
    category: 'work',
    description: 'Manager texts on Saturday evening asking you to draft a non-critical client deck.',
    platform: 'whatsapp',
    relationship: 'Direct Manager / Supervisor',
    purpose: 'Protect weekend boundaries politely while proposing a prompt Monday delivery',
    chatHistory: `[Friday 5:00 PM] David (Manager): Great sprint wrap today everyone. Have a restful weekend!
[Saturday 7:45 PM] David: Hey, sorry to message on the weekend. The VP just pinged asking if we can have a preliminary draft of the Q3 growth roadmap ready before Monday 9 AM sync.`,
    latestMessage: `Could you jump on your laptop for 2 hours tonight or tomorrow morning to knock this out?`,
    suggestedTones: ['Professional', 'Diplomatic', 'Direct'],
  },
  {
    id: 'linkedin-recruiter',
    title: 'LinkedIn Recruiter Re-engagement',
    category: 'work',
    description: 'A tech recruiter followed up with an intriguing Lead Engineer role.',
    platform: 'linkedin',
    relationship: 'Executive Recruiter (external)',
    purpose: 'Express polite interest while asking for compensation band and tech stack',
    chatHistory: `[Monday] Sarah Jenkins (Tech Talent Partner): Hi! I've been following your work and would love to connect. We have a Lead Full-Stack Architect role open that aligns closely with your background in high-scale systems.
[Tuesday] You: Hi Sarah, thanks for reaching out. What stage is the company at right now?
[Tuesday] Sarah Jenkins: We are Series B funded ($45M) and growing our engineering team by 50% this quarter. Fully remote friendly!`,
    latestMessage: `Would you be open for a quick 15-minute introductory sync this Thursday or Friday afternoon?`,
    suggestedTones: ['Professional', 'Polite', 'Confident'],
  },
  {
    id: 'salary-negotiation-offer',
    title: 'Salary & Package Counter-Offer',
    category: 'work',
    description: 'Received a formal job offer that is 15% below target market rate.',
    platform: 'custom',
    relationship: 'Hiring Manager / HR Director',
    purpose: 'Enthusiastically accept the role while countering for target compensation based on value',
    chatHistory: `[Email Thread] HR: Dear Candidate, We are thrilled to extend an offer for the Senior Product Strategist position at $125,000 base salary with standard benefits.
[You]: Thank you so much for this exciting offer! I am genuinely thrilled about the team's mission and product trajectory.`,
    latestMessage: `Please let us know if you can sign and return the offer letter by end of day Friday so we can finalize onboarding.`,
    suggestedTones: ['Professional', 'Confident', 'Diplomatic'],
  },
  {
    id: 'instagram-story-flirt',
    title: 'Instagram Story Reaction & Banter',
    category: 'social',
    description: 'A friend / crush replied to a travel story with playful teasing.',
    platform: 'instagram',
    relationship: 'Crush / Acquaintance',
    purpose: 'Keep it playful, lighthearted, and open up an invitation to meet up',
    chatHistory: `[Story Reply: Photo of mountain sunset with coffee]
[2:30 PM] Maya: Okay wow that view is unreal!! Where is this?!
[3:15 PM] You: Up at Emerald Ridge! Did a sunrise hike this morning. Best espresso in the wild ☕
[3:20 PM] Maya: You woke up at 5 AM voluntarily? Who are you and what have you done with the real you haha`,
    latestMessage: `Next time you go you HAVE to let me tag along, promise?`,
    suggestedTones: ['Playful', 'Friendly', 'Warm'],
  },
  {
    id: 'client-unpaid-invoice',
    title: 'Overdue Freelance Invoice Reminder',
    category: 'work',
    description: 'Client payment is 21 days past net-30 terms despite deliverable sign-off.',
    platform: 'custom',
    relationship: 'Freelance Client Account Lead',
    purpose: 'Firmly request payment update without burning bridges or sounding accusatory',
    chatHistory: `[3 Weeks Ago] You: Hi Brian, attached is Invoice #1042 for the brand redesign sprint, due on Oct 5.
[2 Weeks Ago] Brian: Received! Forwarding to our billing department now.
[Last Week] You: Hi Brian, just a friendly follow-up regarding invoice #1042. Let me know if accounts payable needs any supplemental tax forms.`,
    latestMessage: `Hey, sorry for the delay, our finance director has been out on PTO. We're trying to process it soon.`,
    suggestedTones: ['Professional', 'Direct', 'Polite'],
  },
  {
    id: 'workplace-deadline-slack',
    title: 'Client Scope Creep & Pushback',
    category: 'work',
    description: 'Client asking if the deliverable is still on track after massive scope additions.',
    platform: 'custom',
    relationship: 'Client Project Manager',
    purpose: 'Explain timeline impact of their latest feature request professionally',
    chatHistory: `[Wednesday] Marcus (Client): Hey team, we just submitted 4 additional user flows for the billing portal. Excited to see these included!
[Thursday] You: Thanks Marcus! We're reviewing the extra scope. It adds about 14 new UI states and Stripe webhook handling.`,
    latestMessage: `We still need the full release ready by this Friday at 5 PM though. We're launching on Monday morning. Can we make that happen?`,
    suggestedTones: ['Professional', 'Diplomatic', 'Direct'],
  },
  {
    id: 'landlord-deposit-dispute',
    title: 'Landlord Security Deposit Dispute',
    category: 'personal',
    description: 'Landlord deducted $700 from security deposit for normal wear and tear.',
    platform: 'custom',
    relationship: 'Former Landlord',
    purpose: 'Politely contest unjustified deductions with reference to move-out photos and tenant law',
    chatHistory: `[Move-out inspection] You: Left keys on counter and apartment scrubbed clean. Sent move-out video walkthrough.
[Yesterday] Landlord: Sending your deposit check back minus $450 for wall repainting and $250 for carpet deep clean.`,
    latestMessage: `The deductions are non-negotiable as the unit required professional turnover before the new tenant moved in.`,
    suggestedTones: ['Professional', 'Direct', 'Polite'],
  },
  {
    id: 'relationship-boundary-ex',
    title: 'Setting Boundary with an Ex',
    category: 'personal',
    description: 'An ex-partner sends a nostalgic late-night message after months of silence.',
    platform: 'whatsapp',
    relationship: 'Ex-partner',
    purpose: 'Respond with dignified courtesy while firmly upholding no-contact boundary',
    chatHistory: `[3 Months Ago] You: We agreed it is best for both of us to take space and move forward separately. Wish you the best.
[Last Night 11:30 PM] Chris: Hey... I was just driving past that diner we used to go to. Heard our song on the radio. Hope you're doing well.`,
    latestMessage: `I really miss having you in my life. Can we grab coffee just to talk? No pressure at all.`,
    suggestedTones: ['Polite', 'Direct', 'Diplomatic'],
  },
  {
    id: 'first-date-followup',
    title: 'After First Date Follow-up',
    category: 'social',
    description: 'Went on a really great first dinner date and want to suggest a second date.',
    platform: 'whatsapp',
    relationship: 'Dating match (first date completed)',
    purpose: 'Show genuine enthusiasm, reference a shared moment, and suggest a specific activity',
    chatHistory: `[Yesterday 10:45 PM] You: Got home safe! Thank you for such a fun evening, genuinely haven't laughed that hard in a while 😊
[Today 9:15 AM] Jordan: Good morning! Same here, that Italian place was incredible. Hope you survived your morning meeting!`,
    latestMessage: `Definitely need to check out that jazz bar you were talking about sometime soon!`,
    suggestedTones: ['Warm', 'Friendly', 'Playful'],
  },
  {
    id: 'friend-borrowed-money',
    title: 'Asking for Repayment of Borrowed Money',
    category: 'personal',
    description: 'A good friend borrowed $250 two months ago and has not mentioned it since.',
    platform: 'whatsapp',
    relationship: 'Good friend',
    purpose: 'Ask for the money back naturally without creating awkwardness or resentment',
    chatHistory: `[2 Months Ago] Mark: Hey man, my car broke down and I'm $250 short for the tow and battery until payday next Friday. Any chance you could Venmo me?
[2 Months Ago] You: No worries at all brother, sent! Hope the car gets sorted quickly.
[1 Month Ago] Mark: Thanks so much again man, you're a lifesaver.`,
    latestMessage: `Hey bro, are you heading to the watch party this Sunday? Everyone is chipping in for pizza and drinks!`,
    suggestedTones: ['Friendly', 'Direct', 'Polite'],
  },
  {
    id: 'destination-wedding-decline',
    title: 'Declining Expensive Destination Wedding',
    category: 'personal',
    description: 'A close cousin invites you to a 5-day wedding in Bali that exceeds budget.',
    platform: 'whatsapp',
    relationship: 'Cousin / Family member',
    purpose: 'Express heartfelt love and congratulations while declining gracefully without financial embarrassment',
    chatHistory: `[Family Announcement] Official invite received for 5-day Bali wedding resort stay.
[Yesterday] Cousin Elena: Hey! We're finalizing the guest count with the venue by Friday! So excited for you to be there with us!`,
    latestMessage: `Did you book your flights yet? Let me know so we can arrange the private airport villa shuttle for you!`,
    suggestedTones: ['Warm', 'Polite', 'Diplomatic'],
  },
  {
    id: 'professor-extension-urgent',
    title: 'Professor Assignment Extension',
    category: 'academic',
    description: 'Fell sick with fever 24 hours before a 15-page term paper deadline.',
    platform: 'custom',
    relationship: 'University Course Professor',
    purpose: 'Politely request a 48-hour extension with documentation offer and current draft preview',
    chatHistory: `[Course Syllabus] Late policy: Deducts 10% per day unless approved extension granted prior to deadline.
[Email draft initiated to Prof. Henderson]`,
    latestMessage: `Reminder: Final Term Paper submissions close tomorrow at 11:59 PM sharp on Canvas. No unexcused late submissions.`,
    suggestedTones: ['Professional', 'Polite', 'Diplomatic'],
  },
  {
    id: 'group-project-slacker',
    title: 'Confronting Group Project Teammate',
    category: 'academic',
    description: 'Team member has not submitted their section of the final capstone presentation due tomorrow.',
    platform: 'whatsapp',
    relationship: 'University Classmate / Project Partner',
    purpose: 'Hold them accountable firmly while giving an immediate deadline before submitting without them',
    chatHistory: `[Monday] You: Hey team, we need Section 3 (Market Analysis) by Wednesday evening so we can merge slides.
[Wednesday] Liam: On it guys, finishing it up tonight!
[Thursday 2 PM] You: Hey Liam, we're doing the final dry run at 6 PM. Still waiting on your slides.`,
    latestMessage: `Sorry was stuck at work all day, I'll try to look at it later tonight maybe around midnight.`,
    suggestedTones: ['Direct', 'Professional', 'Polite'],
  },
  {
    id: 'discord-squad-tourney',
    title: 'Discord Squad Tournament Coordination',
    category: 'social',
    description: 'Gaming squad discussing tournament roster and training times.',
    platform: 'discord',
    relationship: 'Longtime gaming clan teammates',
    purpose: 'Confirm availability and hype up the squad with gamer banter',
    chatHistory: `[8:00 PM] @Viper: Registration closes in 2 hours for Saturday's regional qualifiers.
[8:05 PM] @Krypto: I'm locked in. Playing anchor.
[8:12 PM] @Ghost: We need one more flex player or we forfeit seed #3.`,
    latestMessage: `@You are you playing with us Saturday or are you gonna leave us hanging again bro? 😂`,
    suggestedTones: ['Funny', 'Confident', 'Friendly'],
  },
  {
    id: 'family-group-unsolicited-advice',
    title: 'Graceful Family Group Chat Boundary',
    category: 'personal',
    description: 'An outspoken aunt posts critical unsolicited career advice in the family group.',
    platform: 'whatsapp',
    relationship: 'Extended family group (Aunts, Uncles, Parents)',
    purpose: 'Acknowledge warmly without engaging in the debate or escalating tension',
    chatHistory: `[Family Chat] Aunt Patricia shared an article: "Why Stable Corporate Jobs are Better Than Risky Startups"
[10:15 AM] Aunt Patricia: @You you should really read this before it's too late! You have a good degree, why waste time with unstable tech projects?`,
    latestMessage: `Your cousin just joined the bank and already got promoted. When are you settling down and getting a real job?`,
    suggestedTones: ['Diplomatic', 'Polite', 'Warm'],
  },
  {
    id: 'genz-groupchat-cooked',
    title: 'Gen Z Group Chat: Flaked Plans',
    category: 'social',
    description: 'Besties roasting you in the group chat after oversleeping brunch.',
    platform: 'snapchat',
    relationship: 'Close college friends / Besties',
    purpose: 'Play along with self-aware Gen Z humor, zero defensiveness, and win back goodwill',
    chatHistory: `[11:15 AM] Zay: bro is still asleep no cap 💀
[11:20 AM] Chloe: we literally ordered pancakes without you bestie, it's giving ghosting`,
    latestMessage: `nah fr fr are you alive or am i about to have main character brunch solo 😭`,
    suggestedTones: ['Gen Z Slang', 'Funny', 'Playful'],
  },
  {
    id: 'genz-rizz-dm',
    title: 'Gen Z Smooth DM Comeback',
    category: 'social',
    description: 'Someone you vibe with reacted to your mirror selfie or concert clip.',
    platform: 'instagram',
    relationship: 'Crush / Mutual follower',
    purpose: 'Match the playful zoomer energy with effortless rizz and zero cringe',
    chatHistory: `[Story: You at an indie night concert]
[10:40 PM] Mia: okay wait why is the fit actually immaculate?? lowkey jealous i missed this`,
    latestMessage: `deadass thought you gatekept this show from me ngl 👀`,
    suggestedTones: ['Gen Z Slang', 'Playful', 'Confident'],
  },
  {
    id: 'genz-exam-panic',
    title: 'Finals Week Academic Meltdown',
    category: 'academic',
    description: 'Study buddy texting at 2 AM before a brutal morning midterm.',
    platform: 'discord',
    relationship: 'Classmate / Study Partner',
    purpose: 'Hype them up with relatable Gen Z energy while sharing practical focus relief',
    chatHistory: `[1:45 AM] Tyler: bro i have 4 chapters left and my brain is literally buffering
[1:50 AM] You: hang in there, focus on chapters 3 and 5 first`,
    latestMessage: `am i cooked for this 8am exam or is there still hope fr 💀`,
    suggestedTones: ['Gen Z Slang', 'Supportive', 'Funny'],
  },
];
