import { db } from "@/database/database.js"
import { Selectable } from "kysely"
import { AppSettings } from "@/database/db.js"

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