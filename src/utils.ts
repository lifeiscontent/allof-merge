import { JsonPath, isObject } from "json-crawl"

import { RefNode } from "./types"

export class MapArray<K, V> extends Map<K, Array<V>> {
  public add(key: K, value: V): this {
    const arr = this.get(key)
    if (arr) {
      arr.push(value)
    } else {
      this.set(key, [value])
    }
    return this
  }
}

export const removeDuplicates = <T>(array: T[]): T[] => {
  const uniqueItems: T[] = [];

  for (const item of array) {
    if (!uniqueItems.some((uniqueItem) => isEqual(uniqueItem, item))) {
      uniqueItems.push(item);
    }
  }

  return uniqueItems;
}

export const mergeValues = (value: any, patch: any) => {
  if (Array.isArray(value) && Array.isArray(patch)) {
    return Array.isArray(patch) ? [...value, ...patch] : [...value]
  } else if (isObject(value) && isObject(patch)) {
    const result = { ...value }
    for(const key of Object.keys(patch)) {
      result[key] = mergeValues(result[key], patch[key])
    }
    return result
  } else {
    return patch
  }
}

export const isRefNode = (value: any): value is RefNode => {
  return value && value.$ref && typeof value.$ref === "string"
}

export const parseRef = ($ref: string, basePath = "") => {
  const [filePath = basePath, ref] = $ref.split("#")

  const pointer = !ref || ref === "/" ? "" : ref
  const normalized = createRef(filePath, pointer)
  
  return { filePath, pointer, normalized }
}

export const createRef = (basePath?: string, pointer?: string): string => {
  if (!basePath) {
    return !pointer ? "#" : `#${pointer}`
  } else {
    return `${basePath}${!pointer ? "" : "#" + pointer}`
  }
}

export const resolveRefNode = (data: any, node: any) => {
  const { $ref, ...rest } = node
  const _ref = parseRef($ref)
  return !_ref.filePath ? resolvePointer(data, _ref.pointer, rest) : undefined
}

const resolvePointer = (data: unknown, pointer: string, sibling?: any): any => {
  if (!isObject(data)) { return }
    
  let value: any = data
  const path = parsePointer(pointer)
  for (const key of path) {
    if (Array.isArray(value) && value.length > +key) {
      value = value[+key]
    } else if (isObject(value) && key in value) {
      value = value[key]
    } else if (isRefNode(value)) {
      value = resolveRefNode(data, value)
    } else {
      return
    }       
  }
  return mergeValues(value, sibling)
}

export const pathMask = {
  slash: /\//g,
  tilde: /~/g,
  escapedSlash: /~1/g,
  escapedTilde: /~0/g
}

export const parsePointer = (pointer: string): string[] => {
  return pointer.split("/").map((i) => decodeURIComponent(i.replace(pathMask.escapedSlash, "/").replace(pathMask.escapedTilde, "~"))).slice(1)
}

export const buildRef = (path: JsonPath, fileName = ""): string => {
  if (!path.length) { return fileName || "#" }
  return fileName + "#" + buildPointer(path)
}

export const buildPointer = (path: JsonPath): string => {
  if (!path.length) { return "" }
  return "/" + path.map((i) => encodeURIComponent((String(i).replace(pathMask.tilde, "~0").replace(pathMask.slash, "~1")))).join("/")
}
export const isEqual = (a: any, b: any) => JSON.stringify(a) == JSON.stringify(b)

export const findMultiplierForInteger = (number: number): number => {
  let multiplier = 1;

  while (number * multiplier % 1 !== 0) {
    multiplier *= 10;
  }

  return multiplier;
}

export function calculateLCM(args: number[]): number {
  const x = args.reduce((r, v) => Math.max(r, findMultiplierForInteger(v)), 0)
  return args.reduce((a, b) => Math.round((a * x * b * x) / calculateGCD(a * x, b * x)) / x)
}

export function calculateGCD(a: number, b: number): number {
  return b === 0 ? a : calculateGCD(b, a % b);
}

export const findCombinations = (vectors: any[][]): any[][] => {
  if (vectors.length === 0) {
    return [[]]; // Base case: empty vector, return an empty combination
  }

  const firstVector = vectors[0];
  const remainingVectors = vectors.slice(1);

  const combinationsOfRemaining = findCombinations(remainingVectors); // Recursively find combinations for remaining vectors

  const combinations = [];
  for (const element of firstVector) {
    for (const combination of combinationsOfRemaining) {
      combinations.push([element, ...combination]); // Add the current element to each combination of the remaining vectors
    }
  }

  return combinations;
}
