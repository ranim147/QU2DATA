import { IResolvers } from "@graphql-tools/utils"
import { Router } from "express"
import { readdirSync } from "fs"
import { DocumentNode } from "graphql"

interface Modules {
  schema: DocumentNode[]
  resolvers: IResolvers[]
}

const modules: Modules = { schema: [], resolvers: [] }

readdirSync(__dirname, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => {
    try {
      const module = require("./" + dirent.name)
      if (Array.isArray(module.default.resolvers)) {
        // @ts-ignore
        modules.schema.push(...module.default.schema)
      } else {
        // @ts-ignore
        modules.schema.push(module.default.schema)
      }
      if (Array.isArray(module.default.resolvers)) {
        // @ts-ignore
        modules.resolvers.push(...module.default.resolvers)
      } else {
        // @ts-ignore
        modules.resolvers.push(module.default.resolvers)
      }
    } catch (error) {
      console.error({ error })
    }
  })

export default modules
