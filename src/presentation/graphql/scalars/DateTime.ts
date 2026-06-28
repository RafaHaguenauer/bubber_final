import { GraphQLScalarType, Kind } from 'graphql'

export const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO-8601 date-time string',
  serialize(value: unknown): string {
    if (value instanceof Date) return value.toISOString()
    throw new Error('DateTime must be a Date object')
  },
  parseValue(value: unknown): Date {
    if (typeof value === 'string') return new Date(value)
    throw new Error('DateTime input must be a string')
  },
  parseLiteral(ast): Date {
    if (ast.kind === Kind.STRING) return new Date(ast.value)
    throw new Error('DateTime literal must be a string')
  },
})
