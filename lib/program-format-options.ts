export interface ProgramFormatOption {
  type: "header" | "option"
  label: string
  value?: string
  category?: string // which header group this option belongs to
}

export const programFormatOptions: ProgramFormatOption[] = [
  { type: "header", label: "Scripted" },
  { type: "option", value: "Live-Action (Scripted)", label: "Live-Action (Scripted)", category: "Scripted" },
  { type: "option", value: "Animated", label: "Animated", category: "Scripted" },
  { type: "option", value: "Hybrid", label: "Hybrid", category: "Scripted" },
  { type: "option", value: "Puppetry", label: "Puppetry", category: "Scripted" },
  { type: "option", value: "Machinima", label: "Machinima", category: "Scripted" },

  { type: "header", label: "Unscripted/Semi-scripted Formats" },
  { type: "option", value: "Reality", label: "Reality", category: "Unscripted/Semi-scripted Formats" },
  { type: "option", value: "Docu-Reality", label: "Docu-Reality", category: "Unscripted/Semi-scripted Formats" },
  { type: "option", value: "Lifestyle", label: "Lifestyle", category: "Unscripted/Semi-scripted Formats" },
  { type: "option", value: "Talk Show", label: "Talk Show", category: "Unscripted/Semi-scripted Formats" },
  { type: "option", value: "Game Show", label: "Game Show", category: "Unscripted/Semi-scripted Formats" },

  { type: "header", label: "Informational Formats" },
  { type: "option", value: "Documentary", label: "Documentary", category: "Informational Formats" },
  { type: "option", value: "Educational", label: "Educational", category: "Informational Formats" },
  { type: "option", value: "How-To/Demonstration", label: "How-To/Demonstration", category: "Informational Formats" },
  { type: "option", value: "News/Current Affairs", label: "News/Current Affairs", category: "Informational Formats" },

  { type: "header", label: "Performance-Based Formats" },
  { type: "option", value: "Variety", label: "Variety", category: "Performance-Based Formats" },
  { type: "option", value: "Music Performance", label: "Music Performance", category: "Performance-Based Formats" },
  { type: "option", value: "Stand-Up Comedy", label: "Stand-Up Comedy", category: "Performance-Based Formats" },
  { type: "option", value: "Theatrical", label: "Theatrical", category: "Performance-Based Formats" },

  { type: "header", label: "Event/Broadcast Formats" },
  { type: "option", value: "Live Event", label: "Live Event", category: "Event/Broadcast Formats" },
  { type: "option", value: "Sports", label: "Sports", category: "Event/Broadcast Formats" },
  { type: "option", value: "Special Presentation", label: "Special Presentation", category: "Event/Broadcast Formats" },
  { type: "option", value: "Anthology", label: "Anthology", category: "Event/Broadcast Formats" },

  { type: "header", label: "Ambient/Low-Narrative Formats" },
  { type: "option", value: "Ambient", label: "Ambient", category: "Ambient/Low-Narrative Formats" },
  { type: "option", value: "Process", label: "Process", category: "Ambient/Low-Narrative Formats" },
  { type: "option", value: "ASMR / Sensory", label: "ASMR / Sensory", category: "Ambient/Low-Narrative Formats" },
  { type: "option", value: "Wellness", label: "Wellness", category: "Ambient/Low-Narrative Formats" },
  { type: "option", value: "Looped Programming", label: "Looped Programming", category: "Ambient/Low-Narrative Formats" },
]

// Get all category header labels
export const programFormatCategories = programFormatOptions
  .filter((o) => o.type === "header")
  .map((o) => o.label)

// Get all option values belonging to a given category header
export function getOptionsForCategory(categoryLabel: string): string[] {
  return programFormatOptions
    .filter((o) => o.type === "option" && o.category === categoryLabel)
    .map((o) => o.value!)
}

// Flat list of just the option values (no headers)
export const programFormatValues = programFormatOptions
  .filter((o) => o.type === "option")
  .map((o) => o.value!)
