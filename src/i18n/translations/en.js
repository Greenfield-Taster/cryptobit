const enTranslations = {
  header: {
    home: "Home",
    about: "About",
    contact: "Contact",
    testimonial: "Testimonial",
    frequentlyQA: "Frequently Q/A",
    transaction: "Transaction",
    register: "Register",
  },
  footer: {
    privacyPolicy: "Privacy Policy",
  },
  home: {
    title: "Safe and secure cryptocurrency transactions",
    description:
      "Buy, sell and exchange using advanced encryption technologies. Fast transaction processing and high level of protection guarantee your financial security.",
    getStarted: "Get Started Now",
  },
  transaction: {
    title: "Cryptobit features",
    exchangeTitle: {
      line1: "Secure way of exchange",
      line2: "Exchange profitably",
    },
    loading: "Loading...",
    cryptocurrencies: "Cryptocurrencies",
    minCount: "Min",
    senderWalletRequired: " wallet is required",
    senderWalletMinLength: "Minimum wallet length is 26 characters",
    senderWalletPlaceholder: "Provide your wallet of",
    recipientWalletRequired: "Recipient wallet is required",
    recipientWalletPlaceholder: "Recipient's wallet",
    saveWallet: "Save wallet",
    selectCrypto: "Select cryptocurrency",
    continue: "Continue",
    authRequired: "You need to sign in or register to continue with payment",
  },
  about: {
    title: "TRANSACTIONS",
    aboutTitle: {
      line1: "Secure way of exchange",
      line2: "Exchange profitably",
    },
    description:
      "Fast cashing and buying cryptocurrency is what this platform prides itself on. Privacy guarantees, data retention and fast transactions.",
    block1: "Exchange Value",
    block2: "User Security",
    block3: "User Dashboard",
    block4: "Asset Registries",
  },
  testimonial: {
    label: "CLIENT STORY",
    title: {
      line1: "Cryptobit Clients",
      line2: "Testimonials",
    },
    text: {
      line1: "Our All Customers",
      line2: "Satisfactions",
    },
  },
  frequentlyQA: {
    subtitle: "Questions & Answers",
    title: "Frequently Questions / Answers",
    description:
      "Globally network emerging action items with best-of-breed core Efficiently build end-to-end mindshare",
  },
  contact: {
    subtitle: "Contact Info",
    title: "Write Us Something",
    getInTouch: "Get In Touch",
    name: "Your Name",
    email: "Enter E-Mail",
    subject: "Subject",
    message: "Message",
    sendMessage: "Send Message",
  },
  payment: {
    titleError: "No payment data available",
    textError: "Please initiate a new payment request.",
    title: "Payment on request",
    info: "After Payment, The Application Is Sent For Processing, Which Takes 10-15 Minutes, After The Funds Are Credited To Your Wallet.",
    commission: "Commission Is 1$",
    label: "Give away",
    receive: "You receive",
    formTitle: "Make a payment to a crypto wallet",
    formLabel: "Wallet network",
    formWallet: "Wallet (hash)",
    cryptocurrency: "Cryptocurrency",
    request: "Request number",
    status: "Request status",
    formDescription:
      "After you pay for the application, click the 'Paid' button",
    paymentExpected: "Payment expected",
    closeRequest: "Close request",
    paid: "Paid",
    processing: "Processing...",
    goHome: "Go to Home",
    copy: "Copied",
    promoCode: "Promo code",
    promoBonus: "bonus",
  },
  paymentSuccess: {
    title: "Payment Successful!",
    description: "Your transaction has been processed successfully.",
    orderId: "Order ID:",
    status:
      "Transaction is being processed. Please wait 10-15 minutes for the funds to be credited.",
    returnProfile: "Move to Profile",
  },
  auth: {
    login: {
      pageTitle: "Sign In",
      title: "Account Login",
      tabTitle: "Login",
      emailLabel: "Email",
      passwordLabel: "Password",
      submitButton: "Sign In",
      registerLink: "Register",
      forgotPasswordLink: "Forgot password?",
    },
    register: {
      pageTitle: "Registration",
      title: "Create Account",
      tabTitle: "Registration",
      emailLabel: "Email",
      passwordLabel: "Password",
      nameLabel: "Name",
      phoneLabel: "Phone number *",
      submitButton: "Register",
      alreadyHaveAccount: "Already have an account?",
      loginLink: "Sign In",
    },
    errors: {
      emailRequired: "Email is required",
      invalidEmail: "Invalid email format",
      passwordRequired: "Password is required",
      passwordTooShort: "Password must contain at least 6 characters",
      nameRequired: "Name is required",
      phoneRequired: "Phone number is required",
      invalidPhone: "Invalid phone number format",
      loginFailed: "Incorrect email or password",
      registrationFailed: "Registration error",
      serverError: "Server error. Please try again later",
    },
    common: {
      loading: "Loading...",
      cancel: "Cancel",
    },
    required: "Authorization required",
  },
  profile: {
    title: "User",
    loading: "Loading profile...",
    personalInfo: "Personal Information",
    email: "Email",
    name: "Name",
    phone: "Phone",
    memberSince: "Member Since",
    notProvided: "Not provided",
    savedWallets: "Saved Wallets",
    noSavedWallets:
      "You don't have any saved wallets yet. When you make a transaction with the 'Save wallet' option, it will appear here.",
    recentTransactions: "Recent Transactions",
    noTransactions: "You haven't made any transactions yet.",
    editProfile: "Edit Profile",
    logout: "Logout",
    statuses: {
      pending: "Pending",
      processing: "Processing",
      completed: "Completed",
      failed: "Failed",
    },
    loadMore: "Load more",
  },
  promoCode: {
    placeholder: "Enter promo code",
    selectSaved: "Select saved promo code",
    checking: "Checking...",
    apply: "Apply",
    expires: "Expires",
    applied: "Промокод применен: +{{discount}}% к транзакции",
    loading: "Loading promo codes...",
  },
  chat: {
    supportChat: "Support Chat",
    loading: "Loading...",
    typeMessage: "Type a message...",
    typeYourMessage: "Type your message...",
    startChat: "Start Chat",
    cancel: "Cancel",
    noMessagesYet: "No messages yet. Start the conversation!",
    startNewChat: "Start New Chat",
    noActiveChats: "You don't have any active chats.",
    startNewChatMessage: "Please describe your question or issue:",
    newConversation: "New Conversation",
    backToChats: "Back to Chats",
    send: "Send",
    minimize: "Minimize",
  },
  privacyPolicy: {
    title: "Privacy Policy",
    section1: {
      title: "1. General Provisions",
      content:
        'This Privacy Policy (hereinafter referred to as the "Policy") regulates the processing and protection of personal data of users (hereinafter referred to as the "User") of the cryptocurrency exchange service (hereinafter referred to as the "Service"). By using the Service, the User agrees to this Policy.',
    },
    section2: {
      title: "2. Collection and Use of Personal Data",
      intro: "The Service may request and collect the following personal data:",
      dataTypes: {
        name: "Full name or pseudonym;",
        contact: "Contact information (email, phone number);",
        payment: "Payment information (cryptocurrency wallets, details);",
        technical: "IP address and device data.",
      },
      usageIntro: "This data is used for:",
      usageTypes: {
        service: "Ensuring the operation of the Service;",
        support: "User support;",
        legal: "Compliance with legal requirements (e.g., AML/KYC);",
        improvement: "Improving service quality.",
      },
    },
    section3: {
      title: "3. Data Protection",
      content:
        "The Service applies modern information security measures, including data encryption and limited employee access to personal data.",
    },
    section4: {
      title: "4. Disclosure to Third Parties",
      intro:
        "The Service does not transfer personal data to third parties, except in cases of:",
      cases: {
        legal: "Compliance with legal requirements;",
        amlKyc: "Conducting AML/KYC procedures;",
        payments: "Processing payments through partners.",
      },
    },
    section5: {
      title: "5. Data Storage",
      content:
        "Personal data is stored for the period necessary to fulfill the purposes of processing, but not less than the period established by law.",
    },
    section6: {
      title: "6. User Rights",
      intro: "The User has the right to:",
      rights: {
        access: "Request access to their data;",
        modify: "Request correction or deletion of data;",
        withdraw: "Withdraw consent to data processing.",
      },
    },
    section7: {
      title: "7. Service Fee",
      content:
        "When exchanging cryptocurrencies, the Service charges a fee from the buyer, the amount of which is indicated when making a transaction.",
    },
    section8: {
      title: "8. Changes to the Policy",
      content:
        "The Service reserves the right to change this Policy. The updated version takes effect from the moment of publication.",
    },
    section9: {
      title: "9. Contact Information",
      content:
        "For issues related to this Policy, the User can contact the Service support through email or messengers indicated on the website.",
    },
  },
};

export default enTranslations;
