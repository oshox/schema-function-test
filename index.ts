import { Type } from '@sinclair/typebox'

type NumberType = {
  display: string
  type: 'number'
}

type TextType = {
  display: string
  type: 'text'
}

type DateType = {
  display: string
  type: 'date'
}

type SchemasType = {
  [key: string]: {[key: string]: NumberType | DateType | TextType }
}

const schemas = {
  foo: {
    date1: {
      display: 'date',
      type: 'date'
    },
    text1: {
      display: 'text',
      type: 'text'
    },
    number1: {
      display: 'number',
      type: 'number'
    }
  },
  bar: {
    date2: {
      display: 'date',
      type: 'date'
    },
    text2: {
      display: 'text',
      type: 'text'
    },
    number2: {
      display: 'number',
      type: 'number'
    }
  },
} as const satisfies SchemasType

function schema(schemaType: keyof typeof schemas) {
  const definitions: typeof schemas[typeof schemaType] = schemas[schemaType]
  type DateColumnKeys = {
    [K in keyof typeof definitions]: typeof definitions[K] extends DateType ? K : never
  }[keyof typeof definitions]

  type TextColumnKeys = {
    [K in keyof typeof definitions]: (typeof definitions)[K] extends {
      type: 'text'
    }
      ? K
      : never
  }[keyof typeof definitions]

  const dateFilter = Type.Optional(
    Type.String({
      pattern:
        '^(?:<|>|<=|>=|=|!=)?\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[0-1])$|^$',
    })
  )
  const numericFilter = Type.Optional(
    Type.String({ pattern: '^(?:<|>|<=|>=|=|!=)?\\d{1,15}$|^$' })
  )
  const textFilter = Type.Optional(Type.String())

  type FilterKey<Key extends string> = `${Key}_filter`
  type DateFilters = { [Key in DateColumnKeys as FilterKey<Key>]: typeof dateFilter }
  type NumericFilters = { [Key in NumericColumnKeys as FilterKey<Key>]: typeof numericFilter }
  type TextFilters = { [Key in TextColumnKeys as FilterKey<Key>]: typeof textFilter }

  const columnFilters = {} as DateFilters & NumericFilters & TextFilters

  for (const columnKey of columnKeys) {
    switch (definitions[`${columnKey}`].type) {
      case 'date': {
        columnFilters[`${columnKey as DateColumnKeys}_filter`] = Type.Optional(dateFilter)
        break
      }
      case 'number': {
        columnFilters[`${columnKey as NumericColumnKeys}_filter`] =
          Type.Optional(numericFilter)
        break
      }
      case 'text': {
        columnFilters[`${columnKey as TextColumnKeys}_filter`] = Type.Optional(textFilter)
        break
      }
      default: {
        throw new Error('Invalid Column Type in Definitions')
      }
    }
  }

  const columnKeysType = Type.Union(columnKeys.map((key) => Type.Literal(key)))

  return Type.Object({
    text_query: Type.Optional(Type.String()),
    sort_by: columnKeysType,
    sort_direction: Type.Union([Type.Literal('asc'), Type.Literal('desc')]),
    page: Type.Integer({ minimum: 1 }),
    count: Type.Union([Type.Literal(20), Type.Literal(100), Type.Literal(500)]),
    columns: Type.Array(columnKeysType),
    ...columnFilters,
  })

  
}
}