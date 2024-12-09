import { CustomHono } from "@/types/app.js"
import { createSuccessRouteDefinition, defaultResponses, sendSuccess } from "@/utils/response.js"
import { createRoute } from "@hono/zod-openapi"
import { z } from "zod"
import { getActiveCountries, getActiveLanguages, getActiveReportReasons, getActiveStatesForCountry, getGroupedSettings } from "./settings.service.js"
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
    // moderation: {
    //   ban_reason: [
    //     {
    //       title: "Offensive Message",
    //       desc: "person is using offensive language"
    //     },
    //     {
    //       title: "Inappropriate Content",
    //       desc: "sharing or displaying inappropriate content"
    //     }
    //   ]
    // }
  }
})

// Commenting as this is merged with the single settings api
// const getSettingsRoute = createRoute({
//   method: 'get',
//   path: '/',
//   tags: [moduleTag],
//   responses: {
//     200: createSuccessRouteDefinition(settingsResponseSchema, 'Retrieve application settings'),
//     ...defaultResponses
//   }
// })

// app.openapi(getSettingsRoute, async (c) => {
//   const groupedSettings = await getGroupedSettings()
//   return sendSuccess(c, groupedSettings, 'Settings retrieved successfully')
// })


// Country Related
const countrySchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  region: z.string()
})

const countriesResponseSchema = z.array(countrySchema)

// Commenting as this is merged with the single settings api
// const getCountriesRoute = createRoute({
//   method: 'get',
//   path: '/countries',
//   tags: [moduleTag],
//   responses: {
//     200: createSuccessRouteDefinition(countriesResponseSchema, 'List of active countries'),
//     ...defaultResponses
//   }
// })

// app.openapi(getCountriesRoute, async (c) => {
//   const countries = await getActiveCountries()
//   return sendSuccess(c, countries, 'Countries retrieved successfully')
// })

// State Related
const stateSchema = z.object({
  id: z.number(),
  name: z.string(),
  state_code: z.string(),
  country_code: z.string()
})

const statesResponseSchema = z.array(stateSchema)

const stateParamsSchema = z.object({
  countryCode: z.string().length(2).openapi({ 
    example: 'US',
    description: 'Two letter country code'
  })
})

const getStatesRoute = createRoute({
  method: 'get',
  path: '/countries/:countryCode/states',
  tags: [moduleTag],
  request: {
    params: stateParamsSchema
  },
  responses: {
    200: createSuccessRouteDefinition(statesResponseSchema, 'List of active states for country'),
    ...defaultResponses
  }
})

app.openapi(getStatesRoute, async (c) => {
  const { countryCode } = c.req.valid('param')
  const states = await getActiveStatesForCountry(countryCode)
  return sendSuccess(c, states, 'States retrieved successfully')
})

// Language Related
const languageSchema = z.object({
  id: z.number(),
  name: z.string(),
  native_name: z.string(),
  code: z.string()
})

const languagesResponseSchema = z.array(languageSchema)

// Commenting as this is merged with the single settings api
// const getLanguagesRoute = createRoute({
//   method: 'get',
//   path: '/languages',
//   tags: [moduleTag],
//   responses: {
//     200: createSuccessRouteDefinition(languagesResponseSchema, 'List of active languages'),
//     ...defaultResponses
//   }
// })

// app.openapi(getLanguagesRoute, async (c) => {
//   const languages = await getActiveLanguages()
//   return sendSuccess(c, languages, 'Languages retrieved successfully')
// })


// Report Reason Related
const reportReasonSchema = z.object({
  id: z.number(),
  ban_reason_code: z.string(),
  title: z.string(),
  desc: z.string()
})

const reportReasonsResponseSchema = z.array(reportReasonSchema)

// Commenting as this is merged with the single settings api
// const getReportReasonsRoute = createRoute({
//   method: 'get',
//   path: '/report-reasons',
//   tags: [moduleTag],
//   responses: {
//     200: createSuccessRouteDefinition(reportReasonsResponseSchema, 'List of active report reasons'),
//     ...defaultResponses
//   }
// })

// app.openapi(getReportReasonsRoute, async (c) => {
//   const reportReasons = await getActiveReportReasons()
//   return sendSuccess(c, reportReasons, 'Report reasons retrieved successfully')
// })

// Settings Merged
const settingsMergedResponseSchema = z.object({
  settings: settingsResponseSchema,
  countries: countriesResponseSchema,
  languages: languagesResponseSchema,
  report_reasons: reportReasonsResponseSchema
})

const getSettingsMergedReasonsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: [moduleTag],
  responses: {
    200: createSuccessRouteDefinition(settingsMergedResponseSchema, 'Merged Settings Response'),
    ...defaultResponses
  }
})

app.openapi(getSettingsMergedReasonsRoute, async (c) => {
  const groupedSettings = await getGroupedSettings()
  const countries = await getActiveCountries()
  const languages = await getActiveLanguages()
  const reportReasons = await getActiveReportReasons()

  const mergedSettings = {
    settings: groupedSettings,
    countries,
    languages,
    report_reasons: reportReasons
  }
  return sendSuccess(c, mergedSettings, 'Report reasons retrieved successfully')
})