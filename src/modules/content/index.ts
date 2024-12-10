import { CustomHono } from "@/types/app.js"
import { AppError, createSuccessRouteDefinition, defaultResponses, ERROR_CODES, sendSuccess } from "@/utils/response.js"
import { createRoute } from "@hono/zod-openapi"
import { z } from "zod"
import { getActivePages, getActivePage, getActiveContentBlocks, getActiveContentBlock } from "./content.service.js"
import { CustomHonoAppFactory } from "@/utils/customHonoAppFactory.js"
import { StatusCodes } from "http-status-codes"

export const app = CustomHonoAppFactory()

const moduleTag = 'content'

// Pages Related
const pageSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.string(),
  content: z.string()
})

const pagesResponseSchema = z.array(pageSchema)

const pageParamsSchema = z.object({
  slug: z.string().openapi({ 
    example: 'privacy-policy',
    description: 'Page slug identifier'
  })
})

const getPageRoute = createRoute({
  method: 'get',
  path: '/pages/:slug',
  tags: [moduleTag],
  request: {
    params: pageParamsSchema
  },
  responses: {
    200: createSuccessRouteDefinition(pageSchema, 'Get page by slug'),
    ...defaultResponses
  }
})

const getPagesRoute = createRoute({
  method: 'get',
  path: '/pages',
  tags: [moduleTag],
  responses: {
    200: createSuccessRouteDefinition(pagesResponseSchema, 'List of active pages'),
    ...defaultResponses
  }
})

app.openapi(getPageRoute, async (c) => {
  const { slug } = c.req.valid('param')
  const page = await getActivePage(slug)

  if(!page) throw new AppError(StatusCodes.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'Page not found')

  return sendSuccess(c, page, 'Page retrieved successfully')
})

app.openapi(getPagesRoute, async (c) => {
  const pages = await getActivePages()
  return sendSuccess(c, pages, 'Pages retrieved successfully')
})

// Content Blocks Related
const contentBlockSchema = z.object({
  id: z.number(),
  purpose: z.string(),
  title: z.string(),
  content: z.record(z.any()),
  type: z.string()
})

const contentBlocksResponseSchema = z.array(contentBlockSchema)

const contentBlockParamsSchema = z.object({
  purpose: z.string().openapi({ 
    example: 'onboarding_step_1',
    description: 'Content block purpose identifier'
  })
})

const getContentBlockRoute = createRoute({
  method: 'get',
  path: '/content-blocks/:purpose',
  tags: [moduleTag],
  request: {
    params: contentBlockParamsSchema
  },
  responses: {
    200: createSuccessRouteDefinition(contentBlockSchema, 'Get content block by purpose'),
    ...defaultResponses
  }
})

const getContentBlocksRoute = createRoute({
  method: 'get',
  path: '/content-blocks',
  tags: [moduleTag],
  responses: {
    200: createSuccessRouteDefinition(contentBlocksResponseSchema, 'List of active content blocks'),
    ...defaultResponses
  }
})

app.openapi(getContentBlockRoute, async (c) => {
  const { purpose } = c.req.valid('param')
  const block = await getActiveContentBlock(purpose)

  if(!block) throw new AppError(StatusCodes.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'Content block not found')

  return sendSuccess(c, block, 'Content block retrieved successfully')
})

app.openapi(getContentBlocksRoute, async (c) => {
  const blocks = await getActiveContentBlocks()
  return sendSuccess(c, blocks, 'Content blocks retrieved successfully')
})