/**
 * Email creation guide content for users without an email address
 * Designed for tech-illiterate users with very specific, step-by-step instructions
 */

export interface EmailGuideContent {
  title: string;
  introduction: string;
  whatYouNeed: string[];
  steps: EmailGuideStep[];
  tips: string[];
  troubleshooting: TroubleshootingItem[];
  externalLink: string;
}

export interface EmailGuideStep {
  stepNumber: number;
  title: string;
  instruction: string;
  substeps?: string[];
  image?: string; // URL to screenshot if available
  tip?: string;
}

export interface TroubleshootingItem {
  problem: string;
  solution: string;
}

/**
 * Gmail creation guide - comprehensive for tech-illiterate users
 */
export const GMAIL_CREATION_GUIDE: EmailGuideContent = {
  title: "How to Create a Free Gmail Email Account",

  introduction: `An email address is essential for job applications and professional communication. Gmail is free, reliable, and easy to use. This guide will walk you through creating your own Gmail account in about 5-10 minutes.`,

  whatYouNeed: [
    "A phone (smartphone or regular phone that can receive text messages)",
    "A computer, tablet, or smartphone with internet access",
    "About 5-10 minutes of your time",
    "An idea for your email address (we'll help you pick one)"
  ],

  steps: [
    {
      stepNumber: 1,
      title: "Open Your Web Browser",
      instruction: "On your computer or phone, open the internet browser you normally use.",
      substeps: [
        "On a computer: Look for Chrome (colorful circle), Safari (blue compass), Firefox (orange fox), or Edge (blue 'e') and click it",
        "On an iPhone: Tap the Safari app (blue compass icon)",
        "On an Android phone: Tap the Chrome app (colorful circle) or your default browser"
      ],
      tip: "If you're not sure which browser to use, Chrome works great with Gmail"
    },
    {
      stepNumber: 2,
      title: "Go to Gmail's Website",
      instruction: "In the address bar at the top of your browser, type: gmail.com and press Enter (or tap Go on your phone).",
      substeps: [
        "Click or tap in the address bar at the very top of the screen",
        "Delete any text that's already there",
        "Type exactly: gmail.com",
        "Press the Enter key on your keyboard, or tap 'Go' on your phone"
      ],
      tip: "Make sure you type 'gmail.com' not 'gmail' in a search box"
    },
    {
      stepNumber: 3,
      title: "Click 'Create Account'",
      instruction: "Look for a link that says 'Create account' and click or tap it.",
      substeps: [
        "You might see a sign-in page first - that's okay",
        "Look below the sign-in button for 'Create account'",
        "Click 'Create account'",
        "When asked, choose 'For myself' (not 'For work or business')"
      ],
      tip: "The button might be blue or just be a text link - both work the same"
    },
    {
      stepNumber: 4,
      title: "Enter Your Name",
      instruction: "Type your first name and last name in the boxes provided.",
      substeps: [
        "In the 'First name' box, type your first name (example: John)",
        "In the 'Last name' box, type your last name (example: Smith)",
        "Use your real name - this is for professional purposes"
      ],
      tip: "Your name will show when you send emails, so use your proper name"
    },
    {
      stepNumber: 5,
      title: "Choose Your Email Address",
      instruction: "Create your unique email address. This is very important for your professional image.",
      substeps: [
        "For a professional email, use your name: firstname.lastname (example: john.smith)",
        "If that's taken, try: firstnamelastname or firstname.middle.lastname",
        "Avoid numbers if possible, but birth year is okay (john.smith1990)",
        "AVOID: nicknames, jokes, or anything unprofessional"
      ],
      tip: "Good examples: john.smith@gmail.com, jsmith@gmail.com. Bad examples: cooldude99@gmail.com, partyanimal@gmail.com"
    },
    {
      stepNumber: 6,
      title: "Create a Strong Password",
      instruction: "Make a password that's secure but easy for you to remember.",
      substeps: [
        "Your password must be at least 8 characters",
        "Use a mix of letters, numbers, and symbols",
        "Example format: FirstPetName + Year + Symbol (like: Buddy2015!)",
        "Type the same password in both 'Password' and 'Confirm' boxes",
        "WRITE THIS DOWN and keep it somewhere safe!"
      ],
      tip: "Don't use obvious passwords like '12345678' or 'password' - these are easy to hack"
    },
    {
      stepNumber: 7,
      title: "Add Your Phone Number",
      instruction: "Enter your phone number. Google will send you a verification code.",
      substeps: [
        "Select your country from the dropdown (usually shows a flag)",
        "Type your phone number (just the numbers, no dashes needed)",
        "Click 'Next' to receive the verification code",
        "Wait for a text message - it usually arrives within 1 minute"
      ],
      tip: "You can use a landline if you choose 'voice call' instead of 'text message'"
    },
    {
      stepNumber: 8,
      title: "Enter Verification Code",
      instruction: "Check your phone for a text message from Google with a 6-digit code.",
      substeps: [
        "Open the text message on your phone",
        "Find the 6-digit number in the message",
        "Type those 6 numbers into the box on your computer/phone",
        "Click 'Verify'"
      ],
      tip: "If you don't get the code within 2 minutes, click 'Resend code'"
    },
    {
      stepNumber: 9,
      title: "Add Recovery Email (Optional)",
      instruction: "You can skip this for now if you don't have another email address.",
      substeps: [
        "If you have another email, enter it here (helps if you forget your password)",
        "If you don't have one, look for 'Skip' or just leave it blank",
        "You can always add this later"
      ]
    },
    {
      stepNumber: 10,
      title: "Add Your Birthday and Gender",
      instruction: "Enter your date of birth and select your gender.",
      substeps: [
        "Select your birth month from the dropdown",
        "Type your birth day (just the number, like 15)",
        "Type your birth year (all 4 digits, like 1990)",
        "Select your gender from the dropdown",
        "Click 'Next'"
      ],
      tip: "This information helps secure your account and is not shown publicly"
    },
    {
      stepNumber: 11,
      title: "Agree to Terms",
      instruction: "Read and agree to Google's terms of service and privacy policy.",
      substeps: [
        "Scroll down to read the terms (or skim them)",
        "Click 'I agree' at the bottom",
        "You might see options for personalization - choose what you're comfortable with"
      ]
    },
    {
      stepNumber: 12,
      title: "You're Done!",
      instruction: "Congratulations! Your Gmail account is now set up and ready to use.",
      substeps: [
        "You should now see your Gmail inbox",
        "Your email address is: [what you chose]@gmail.com",
        "You can now receive and send professional emails",
        "Bookmark this page (Ctrl+D on computer) to easily find Gmail later"
      ],
      tip: "Send a test email to yourself to make sure everything works!"
    }
  ],

  tips: [
    "Save your password somewhere safe - write it down and keep it in a secure place",
    "Check your email regularly - employers expect quick responses",
    "Set up Gmail on your phone too so you never miss an important email",
    "Your email signature should be professional: just your name and phone number",
    "Always use professional language in job-related emails"
  ],

  troubleshooting: [
    {
      problem: "The username I want is already taken",
      solution: "Try adding your middle initial, birth year, or a number. Example: john.m.smith or johnsmith1990"
    },
    {
      problem: "I'm not receiving the verification code",
      solution: "Wait 2 minutes, then click 'Resend'. Make sure your phone number is correct. Try voice call option instead of text."
    },
    {
      problem: "It says my password is too weak",
      solution: "Add more characters, mix uppercase and lowercase letters, add numbers and symbols like ! or @"
    },
    {
      problem: "I forgot my password right after creating it",
      solution: "Click 'Forgot password' on the sign-in page. Google will send a code to your phone to reset it."
    },
    {
      problem: "The page looks different from these instructions",
      solution: "Google occasionally updates their design. Look for similar buttons like 'Create', 'Next', or 'Sign up'."
    }
  ],

  externalLink: "https://support.google.com/mail/answer/56256"
};

/**
 * Get the inline guide content (shorter version for display in chat)
 */
export function getInlineEmailGuide(language: string = 'en'): string {
  // For now, return English. Can expand to other languages later.
  return `## Creating a Gmail Account (Free)

**What You Need:**
- A phone that can receive text messages
- About 5-10 minutes

**Quick Steps:**

1. **Go to gmail.com** in your web browser

2. **Click "Create account"** then choose "For myself"

3. **Enter your name** - use your real, professional name

4. **Choose your email address:**
   - Good: firstname.lastname@gmail.com
   - Avoid: nicknames or unprofessional words

5. **Create a password:**
   - At least 8 characters
   - Mix letters, numbers, and symbols
   - Example: MyDog2020!
   - WRITE IT DOWN!

6. **Verify your phone:**
   - Enter your phone number
   - Type the 6-digit code from the text message

7. **Add birthday and agree to terms**

8. **Done!** Your new email is ready.

**Need more help?** Here's a detailed guide with pictures: https://support.google.com/mail/answer/56256`;
}

/**
 * Get full step-by-step guide (for expanded view or external page)
 */
export function getFullEmailGuide(): EmailGuideContent {
  return GMAIL_CREATION_GUIDE;
}

/**
 * Professional email suggestions based on user's name
 */
export function suggestProfessionalEmails(
  firstName: string,
  lastName: string,
  middleInitial?: string
): string[] {
  const first = firstName.toLowerCase().trim();
  const last = lastName.toLowerCase().trim();
  const middle = middleInitial?.toLowerCase().trim() || '';

  const suggestions: string[] = [];

  // Most professional options first
  suggestions.push(`${first}.${last}@gmail.com`);
  suggestions.push(`${first}${last}@gmail.com`);

  if (middle) {
    suggestions.push(`${first}.${middle}.${last}@gmail.com`);
    suggestions.push(`${first}${middle}${last}@gmail.com`);
  }

  suggestions.push(`${first[0]}${last}@gmail.com`);  // jsmith
  suggestions.push(`${first}.${last[0]}@gmail.com`); // john.s

  if (middle) {
    suggestions.push(`${first}${middle[0]}${last}@gmail.com`); // johnmsmith
  }

  return suggestions.slice(0, 5); // Return top 5 suggestions
}

/**
 * Check if a proposed email address looks professional
 */
export function isEmailProfessional(email: string): {
  isProfessional: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const localPart = email.split('@')[0].toLowerCase();

  // Check for unprofessional patterns
  const unprofessionalPatterns = [
    { pattern: /sexy|hot|cute|babe|baby/i, issue: "Avoid suggestive words" },
    { pattern: /420|69|xxx/i, issue: "Avoid inappropriate numbers or references" },
    { pattern: /party|drunk|beer|weed/i, issue: "Avoid party/substance references" },
    { pattern: /crazy|insane|psycho|killer/i, issue: "Avoid extreme words" },
    { pattern: /loser|dumb|stupid|idiot/i, issue: "Avoid negative words" },
    { pattern: /princess|angel|demon|devil/i, issue: "Keep it simple and professional" },
    { pattern: /gamer|ninja|boss|king|queen/i, issue: "Avoid informal titles or gaming references" },
  ];

  for (const { pattern, issue } of unprofessionalPatterns) {
    if (pattern.test(localPart)) {
      issues.push(issue);
    }
  }

  // Check for excessive numbers
  const numberCount = (localPart.match(/\d/g) || []).length;
  if (numberCount > 4) {
    issues.push("Too many numbers - try to keep it simple");
  }

  // Check for underscores (dots are preferred)
  if (localPart.includes('_')) {
    issues.push("Use dots (.) instead of underscores (_) for a cleaner look");
  }

  return {
    isProfessional: issues.length === 0,
    issues
  };
}
