import { Type } from '@sinclair/typebox'

const schemas = {
  foo: {
    date1: {
      display: 'date',
      type: 'date',
    },
    text1: {
      display: 'text',
      type: 'text',
    },
    number1: {
      display: 'number',
      type: 'number',
    },
    number11: {
      display: 'number',
      type: 'number',
    },
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
} as const

type NumericKeyDeriver<T> = T extends T ?{
  [K in keyof T]: T[K] extends {
    type: 'number'
  }
    ? K
    : never
}[keyof T]: never

type DateKeyDeriver<T> = T extends T ?{
  [K in keyof T]: T[K] extends {
    type: 'date'
  }
    ? K
    : never
}[keyof T]: never

type TextKeyDeriver<T> = T extends T ?{
  [K in keyof T]: T[K] extends {
    type: 'text'
  }
    ? K
    : never
}[keyof T]: never

function schema(schemaType: keyof typeof schemas) {
  const fields = schemas[schemaType]
  type Fields = typeof fields
  type FieldNames = keyof Fields
  const fieldNames: Array<keyof Fields> = Object.keys(fields)

  type NumericColumnKeys = NumericKeyDeriver<typeof fields>

  type DateColumnKeys = DateKeyDeriver<typeof fields>

  type TextColumnKeys = TextKeyDeriver<typeof fields>

  const dateFilter = Type.Optional(Type.RegExp(/^\d\d\d\d-[0-1]\d-[0-3]\d$/))
  const numericFilter = Type.Optional(Type.Number())
  const textFilter = Type.Optional(Type.String())

  type FilterKey<Key extends string> = `${Key}_filter`
  type DateFilters = {
    [Key in DateColumnKeys as FilterKey<Key>]: typeof dateFilter
  }
  type NumericFilters = {
    [Key in NumericColumnKeys as FilterKey<Key>]: typeof numericFilter
  }
  type TextFilters = {
    [Key in TextColumnKeys as FilterKey<Key>]: typeof textFilter
  }

  const fieldFilters = {} as DateFilters & NumericFilters & TextFilters

  for (const fieldName of fieldNames) {
    switch (fields[`${fieldName}`].type) {
      case 'date': {
        fieldFilters[`${fieldName as DateColumnKeys}_filter`] =
          Type.Optional(dateFilter)
        break
      }
      case 'number': {
        fieldFilters[`${fieldName as NumericColumnKeys}_filter`] =
          Type.Optional(numericFilter)
        break
      }
      case 'text': {
        fieldFilters[`${fieldName as TextColumnKeys}_filter`] =
          Type.Optional(textFilter)
        break
      }
      default: {
        throw new Error('Invalid Column Type in Definitions')
      }
    }
  }

  const columnKeysType = Type.Union(fieldNames.map((key) => Type.Literal(key)))

  return Type.Object({
    sort_by: columnKeysType,
    sort_direction: Type.Union([Type.Literal('asc'), Type.Literal('desc')]),
    ...fieldFilters
  })
}

const fooSchema = schema('foo')

import { TypeCompiler } from '@sinclair/typebox/compiler'
const fooValidator = TypeCompiler.Compile(fooSchema)

const validObject = {
  sort_by: 'date1',
  sort_direction: 'desc',
  date1_filter: '2022-03-25',
  number1_filter: 1,
  text1_filter: 'text'
}

console.log('Valid object is valid:', fooValidator.Check(validObject))
console.log('Errors:', ...fooValidator.Errors(validObject))

const invalidObject = {
  sort_by: 'date1',
  sort_direction: 'des',
  text1_filter: 'text'
}

console.log('Invalid object is valid:', fooValidator.Check(invalidObject))
console.log('Errors', ...fooValidator.Errors(invalidObject))
