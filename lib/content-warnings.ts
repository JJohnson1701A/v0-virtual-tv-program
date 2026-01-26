// Content Warning Categories and Subcategories

export interface ContentWarningSubcategory {
  value: string
  label: string
}

export interface ContentWarningCategory {
  id: string
  label: string
  description: string
  subcategories: ContentWarningSubcategory[]
}

export const contentWarningCategories: ContentWarningCategory[] = [
  {
    id: "violence",
    label: "Violence",
    description: "Used for physical harm, threats, combat, and peril",
    subcategories: [
      { value: "mild-violence", label: "Mild Violence (cartoonish, non-injurious)" },
      { value: "moderate-violence", label: "Moderate Violence (non-graphic fights, action)" },
      { value: "intense-graphic-violence", label: "Intense / Graphic Violence" },
      { value: "animal-cruelty", label: "Animal Cruelty" },
      { value: "blood-gore", label: "Blood / Gore" },
      { value: "domestic-violence", label: "Domestic Violence" },
      { value: "fantasy-violence", label: "Fantasy Violence" },
      { value: "gun-violence", label: "Gun Violence" },
      { value: "medical-surgical", label: "Medical / Surgical Procedures" },
      { value: "supernatural-violence", label: "Supernatural Violence" },
      { value: "threatening-behavior", label: "Threatening Behavior" },
      { value: "torture-cruelty", label: "Torture / Cruelty" },
      { value: "war-combat", label: "War / Combat" },
    ],
  },
  {
    id: "sexual-content",
    label: "Sexual Content",
    description: "Anything sexualized, implied, or explicit",
    subcategories: [
      { value: "crossdressing", label: "Crossdressing" },
      { value: "fetish-content", label: "Fetish Content" },
      { value: "full-nudity", label: "Full Nudity" },
      { value: "homosexuality", label: "Homosexuality" },
      { value: "implied-sexual-activity", label: "Implied Sexual Activity" },
      { value: "infidelity-adultery", label: "Infidelity / Adultery" },
      { value: "interracial-intercultural", label: "Interracial/Intercultural Relationships" },
      { value: "partial-nudity", label: "Partial Nudity" },
      { value: "prostitution", label: "Prostitution" },
      { value: "romantic-themes", label: "Romantic Themes" },
      { value: "sexual-assault-rape", label: "Sexual Assault / Rape" },
      { value: "sexual-humor", label: "Sexual Humor" },
      { value: "sexual-situations", label: "Sexual Situations (non-graphic)" },
      { value: "suggestive-dialogue", label: "Suggestive Dialogue" },
      { value: "teen-sexuality", label: "Teen Sexuality" },
      { value: "transgenderism", label: "Transgenderism" },
    ],
  },
  {
    id: "language",
    label: "Language",
    description: "Speech-based concerns",
    subcategories: [
      { value: "blasphemy", label: "Blasphemy" },
      { value: "bullying-language", label: "Bullying Language" },
      { value: "crude-humor", label: "Crude Humor" },
      { value: "harassment-threats", label: "Harassment / Threats" },
      { value: "left-wing-politics-lang", label: "Left-Wing Politics" },
      { value: "mild-language", label: "Mild Language" },
      { value: "misandry-feminism", label: "Misandry / Feminism" },
      { value: "religious-profanity", label: "Religious Profanity" },
      { value: "sexual-language", label: "Sexual Language" },
      { value: "slurs-hate-speech", label: "Slurs / Hate Speech" },
      { value: "strong-language", label: "Strong Language" },
      { value: "alternative-lifestyles", label: "Supporting alternative lifestyles" },
    ],
  },
  {
    id: "substance",
    label: "Substance Use or Abuse",
    description: "Consumption, misuse, or glorification",
    subcategories: [
      { value: "alcohol-use", label: "Alcohol Use" },
      { value: "drug-use-implied", label: "Drug Use (implied)" },
      { value: "illegal-drug-use", label: "Illegal Drug Use" },
      { value: "intoxication", label: "Intoxication" },
      { value: "prescription-drug-misuse", label: "Prescription Drug Misuse" },
      { value: "smoking-tobacco", label: "Smoking / Tobacco" },
      { value: "substance-abuse-themes", label: "Substance Abuse Themes" },
      { value: "vaping", label: "Vaping" },
    ],
  },
  {
    id: "emotional",
    label: "Emotional Content",
    description: "Psychological tone and intensity",
    subcategories: [
      { value: "anxiety-panic", label: "Anxiety / Panic" },
      { value: "fear-suspense", label: "Fear / Suspense" },
      { value: "gaslighting-manipulation", label: "Gaslighting / Manipulation" },
      { value: "gloom-hopelessness", label: "Gloom / Hopelessness" },
      { value: "intense-themes", label: "Intense Themes" },
      { value: "menacing-atmosphere", label: "Menacing Atmosphere" },
      { value: "mental-illness", label: "Mental Illness" },
      { value: "paranoia", label: "Paranoia" },
      { value: "psychological-distress", label: "Psychological Distress" },
    ],
  },
  {
    id: "trauma",
    label: "Trauma",
    description: "Serious harm with lasting impact",
    subcategories: [
      { value: "attempted-suicide", label: "Attempted Suicide" },
      { value: "death", label: "Death" },
      { value: "disaster-imagery", label: "Disaster Imagery" },
      { value: "grief-mourning", label: "Grief / Mourning" },
      { value: "mass-casualties", label: "Mass Casualties" },
      { value: "on-screen-death", label: "On-Screen Death" },
      { value: "self-harm", label: "Self-Harm" },
      { value: "suicidal-ideation", label: "Suicidal Ideation" },
      { value: "suicide", label: "Suicide" },
      { value: "torture-trauma", label: "Torture Trauma" },
    ],
  },
  {
    id: "social",
    label: "Social Themes",
    description: "Human conflict, injustice, and moral issues",
    subcategories: [
      { value: "abuse", label: "Abuse" },
      { value: "anti-patriarchical", label: "Anti-Patriarchical Propaganda" },
      { value: "bigotry", label: "Bigotry" },
      { value: "child-abuse-neglect", label: "Child Abuse / Neglect" },
      { value: "crime", label: "Crime" },
      { value: "cross-dressing-social", label: "Cross-Dressing" },
      { value: "dei-advocacy", label: "DEI Advocacy" },
      { value: "discrimination", label: "Discrimination" },
      { value: "extremism-terrorism", label: "Extremism / Terrorism" },
      { value: "feminism-social", label: "Feminism" },
      { value: "gang-activity", label: "Gang Activity" },
      { value: "homosexuality-social", label: "Homosexuality" },
      { value: "human-trafficking", label: "Human Trafficking" },
      { value: "immigration", label: "Immigration" },
      { value: "kidnapping", label: "Kidnapping" },
      { value: "left-wing-politics-social", label: "Left-Wing Politics/Propaganda" },
      { value: "misandry-social", label: "Misandry" },
      { value: "organized-crime", label: "Organized Crime" },
      { value: "police-justice-violence", label: "Police / Justice System Violence" },
      { value: "political-themes", label: "Political Themes" },
      { value: "racism", label: "Racism" },
      { value: "sexism", label: "Sexism" },
      { value: "transgenderism-social", label: "Transgenderism" },
      { value: "woke-ideology", label: "Woke Ideology" },
    ],
  },
  {
    id: "religious",
    label: "Religious and Supernatural",
    description: "Faith-based and otherworldly content",
    subcategories: [
      { value: "anti-religious", label: "Anti-Religious Themes" },
      { value: "blasphemy-religious", label: "Blasphemy" },
      { value: "cult-behavior", label: "Cult Behavior" },
      { value: "demonic-imagery", label: "Demonic Imagery" },
      { value: "false-religion", label: "False Religion" },
      { value: "magic", label: "Magic" },
      { value: "occult-themes", label: "Occult Themes" },
      { value: "possession", label: "Possession" },
      { value: "religious-conflict", label: "Religious Conflict" },
      { value: "religious-themes", label: "Religious Themes" },
      { value: "satanic-themes", label: "Satanic Themes" },
      { value: "witchcraft", label: "Witchcraft" },
    ],
  },
  {
    id: "children",
    label: "Children-Specific Concerns",
    description: "Used when content is otherwise mild",
    subcategories: [
      { value: "bullying-children", label: "Bullying" },
      { value: "cartoon-violence", label: "Cartoon Violence" },
      { value: "child-endangerment", label: "Child Endangerment" },
      { value: "communism", label: "Communism" },
      { value: "crossdressing-children", label: "Crossdressing" },
      { value: "environmentalist-propaganda", label: "Environmentalist Propaganda" },
      { value: "fascism", label: "Fascism" },
      { value: "fantasy-peril", label: "Fantasy Peril" },
      { value: "feminism-children", label: "Feminism" },
      { value: "gender-ideology", label: "Gender Ideology" },
      { value: "homosexuality-children", label: "Homosexuality" },
      { value: "imitative-behavior", label: "Imitative Behavior" },
      { value: "left-wing-politics-children", label: "Left-Wing Politics" },
      { value: "moral-ambiguity", label: "Moral Ambiguity" },
      { value: "rough-play", label: "Rough Play" },
      { value: "scary-scenes", label: "Scary Scenes" },
      { value: "socialism", label: "Socialism" },
      { value: "toilet-humor", label: "Toilet Humor" },
      { value: "transgenderism-children", label: "Transgenderism" },
      { value: "woke-children", label: "Woke" },
    ],
  },
  {
    id: "other",
    label: "Other / Real-World Sensitivity",
    description: "Modern advisory content and special cases",
    subcategories: [
      { value: "disaster-coverage", label: "Disaster Coverage" },
      { value: "historical-trauma", label: "Historical Trauma" },
      { value: "news-footage", label: "News Footage" },
      { value: "pandemic-illness", label: "Pandemic / Illness" },
      { value: "police-violence-other", label: "Police Violence" },
      { value: "public-health-crisis", label: "Public Health Crisis" },
      { value: "real-world-tragedy", label: "Real-World Tragedy" },
      { value: "reenactments", label: "Reenactments" },
      { value: "school-violence", label: "School Violence" },
      { value: "war-footage", label: "War Footage" },
    ],
  },
]

// Structured content warning data stored on media items
export interface ContentWarningData {
  enabled: boolean
  categories: string[] // Array of category IDs that are checked
  subcategories: string[] // Array of subcategory values that are checked
}

// For channel filtering (tri-state)
export interface ContentWarningFilter {
  include: string[] // Category/subcategory values to include
  exclude: string[] // Category/subcategory values to exclude
}
