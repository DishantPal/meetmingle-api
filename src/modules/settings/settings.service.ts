import { db } from "@/database/database.js"
import { Selectable } from "kysely"
import { AppSettings,Countries, States, Languages, ReportReasons } from "@/database/db.js"

export const getSettings = async (): Promise<Selectable<AppSettings>[]> => {
  const settings = await db
    .selectFrom("app_settings")
    .selectAll()
    .execute()

  return settings
}

export const getGroupedSettings = async (): Promise<Record<string, Record<string, any>>> => {
  const settings = await getSettings()
  
  return settings.reduce((acc, setting) => {
    const group = setting.group
    const key = setting.key
    let parsedValue: any = setting.value

    try {
      if (setting.value.startsWith('[') || setting.value.startsWith('{')) {
        parsedValue = JSON.parse(setting.value)
      }
    } catch {
      parsedValue = setting.value
    }
    
    if (!acc[group]) {
      acc[group] = {}
    }
    
    acc[group][key] = parsedValue
    
    return acc
  }, {} as Record<string, Record<string, any>>)
}

// Country Related
export const getActiveCountries = async (): Promise<Selectable<Countries>[]> => {
  const countries = await db
    .selectFrom("countries")
    .selectAll()
    .where("is_active", "=", 1)
    .orderBy("name", "asc")
    .execute()

  return countries
}

// State Related
export const getActiveStatesForCountry = async (countryCode: string): Promise<Selectable<States>[]> => {
  const states = await db
    .selectFrom("states")
    .selectAll()
    .where("country_code", "=", countryCode)
    .where("is_active", "=", 1)
    .orderBy("name", "asc")
    .execute()

  return states
}

// Language Related
export const getActiveLanguages = async (): Promise<Selectable<Languages>[]> => {
  const languages = await db
    .selectFrom("languages")
    .selectAll()
    .where("is_active", "=", 1)
    .orderBy("name", "asc")
    .execute()

  return languages
}

// Report Reason Related
export const getActiveReportReasons = async (): Promise<Selectable<ReportReasons>[]> => {
  const reportReasons = await db
    .selectFrom("report_reasons")
    .selectAll()
    .where("is_active", "=", 1)
    .orderBy("title", "asc")
    .execute()

  return reportReasons
}