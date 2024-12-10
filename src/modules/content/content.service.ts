import { db } from "@/database/database.js"
import { Selectable } from "kysely"
import { Pages, ContentBlocks } from "@/database/db.js"

// Pages Related
export const getActivePage = async (slug: string): Promise<Selectable<Pages> | undefined> => {
  const page = await db
    .selectFrom("pages")
    .selectAll()
    .where("slug", "=", slug)
    .where("is_active", "=", 1)
    .executeTakeFirst()

  return page
}

export const getActivePages = async (): Promise<Selectable<Pages>[]> => {
  const pages = await db
    .selectFrom("pages")
    .selectAll()
    .where("is_active", "=", 1)
    .orderBy("title", "asc")
    .execute()

  return pages
}

// Content Blocks Related
export const getActiveContentBlock = async (purpose: string): Promise<Selectable<ContentBlocks> | undefined> => {
  const block = await db
    .selectFrom("content_blocks")
    .selectAll()
    .where("purpose", "=", purpose)
    .where("is_active", "=", 1)
    .executeTakeFirst()

  return block
}

export const getActiveContentBlocks = async (): Promise<Selectable<ContentBlocks>[]> => {
  const blocks = await db
    .selectFrom("content_blocks")
    .selectAll()
    .where("is_active", "=", 1)
    .orderBy("title", "asc")
    .execute()

  return blocks
}