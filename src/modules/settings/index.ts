import { CustomHono } from "@/types/app.js"
import { createSuccessRouteDefinition, defaultResponses, sendSuccess } from "@/utils/response.js"
import { createRoute } from "@hono/zod-openapi"
import { z } from "zod"
import { getGroupedSettings } from "./settings.service.js"
import { CustomHonoAppFactory } from "@/utils/customHonoAppFactory.js"

export const app = CustomHonoAppFactory()

const moduleTag = 'settings'

// Schema for individual setting values (can be string or array/object as JSON)
const settingValueSchema = z.union([
  z.string(),
  z.array(z.any()),
  z.record(z.any())
])

// Schema for grouped settings
const settingsResponseSchema = z.record(
  z.string(),
  z.record(z.string(), settingValueSchema)
).openapi({
  example: {
    general: {
      appname: "RandomVideoCallingApp",
      minimum_age: "18"
    },
    profile_options: {
      gender: ["male", "female", "others"],
      relation_ship_status: [
        "Single",
        "In a relationship",
        "Dating",
        "Open to Date"
      ]
    },
    moderation: {
      ban_reason: [
        {
          title: "Offensive Message",
          desc: "person is using offensive language"
        },
        {
          title: "Inappropriate Content",
          desc: "sharing or displaying inappropriate content"
        }
      ]
    }
  }
})

const getSettingsRoute = createRoute({
  method: 'get',
  path: '/settings',
  tags: [moduleTag],
  responses: {
    200: createSuccessRouteDefinition(settingsResponseSchema, 'Retrieve application settings'),
    ...defaultResponses
  }
})

app.openapi(getSettingsRoute, async (c) => {
  const groupedSettings = await getGroupedSettings()
  return sendSuccess(c, groupedSettings, 'Settings retrieved successfully')
})