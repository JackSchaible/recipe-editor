/**
 * Utility function to generate a unique numeric ID
 */
export function generateId(_name: string, existingIds: number[] = []): number {
    // Find the highest existing ID and add 1
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    return maxId + 1;
}

/**
 * Get all existing IDs from a list of entities with an ID field
 */
export function getExistingIds<T>(entities: T[], idField: keyof T): number[] {
    return entities.map((entity) => Number(entity[idField]));
}

/**
 * Normalize a value to the nearest appropriate SI unit
 * @param value - The numeric value to normalize
 * @param inputUnit - The input unit (e.g., 'L', 'Wh', 'g', 'kg', 'm', etc.)
 * @returns Formatted string with value and appropriate SI prefix
 */
export function normalizeToSIUnit(value: number, inputUnit: string): string {
    if (value === 0) return `0 ${inputUnit}`;

    // SI prefixes lookup map (ordered from largest to smallest for detection)
    const siPrefixMap = new Map([
        ["Q", 1e30], // quetta
        ["R", 1e27], // ronna
        ["Y", 1e24], // yotta
        ["Z", 1e21], // zetta
        ["E", 1e18], // exa
        ["P", 1e15], // peta
        ["T", 1e12], // tera
        ["G", 1e9], // giga
        ["M", 1e6], // mega
        ["k", 1e3], // kilo
        ["h", 1e2], // hecto
        ["da", 1e1], // deka (note: two-character prefix)
        ["", 1], // base unit
        ["d", 1e-1], // deci
        ["c", 1e-2], // centi
        ["m", 1e-3], // milli
        ["μ", 1e-6], // micro
        ["n", 1e-9], // nano
        ["p", 1e-12], // pico
        ["f", 1e-15], // femto
        ["a", 1e-18], // atto
        ["z", 1e-21], // zepto
        ["y", 1e-24], // yocto
        ["r", 1e-27], // ronto
        ["q", 1e-30], // quecto
    ]);

    // Parse the input unit to extract existing prefix and base unit
    let actualValue = value;
    let baseUnit = inputUnit;

    // Check if the input unit starts with an SI prefix
    // Handle "da" (deka) first since it's two characters
    if (inputUnit.startsWith("da")) {
        baseUnit = inputUnit.substring(2);
        actualValue = value * 1e1; // Convert to base unit value
    } else {
        // Check single-character prefixes
        for (const [prefix, multiplier] of siPrefixMap) {
            if (
                prefix !== "" &&
                prefix !== "da" &&
                inputUnit.startsWith(prefix)
            ) {
                // Found a prefix, extract the base unit and adjust the value
                baseUnit = inputUnit.substring(prefix.length);
                actualValue = value * multiplier; // Convert to base unit value
                break;
            }
        }
    }

    // Array of prefixes for finding the best display unit (ordered from smallest to largest)
    const orderedPrefixes = [
        { prefix: "q", multiplier: 1e-30 }, // quecto
        { prefix: "r", multiplier: 1e-27 }, // ronto
        { prefix: "y", multiplier: 1e-24 }, // yocto
        { prefix: "z", multiplier: 1e-21 }, // zepto
        { prefix: "a", multiplier: 1e-18 }, // atto
        { prefix: "f", multiplier: 1e-15 }, // femto
        { prefix: "p", multiplier: 1e-12 }, // pico
        { prefix: "n", multiplier: 1e-9 }, // nano
        { prefix: "μ", multiplier: 1e-6 }, // micro
        { prefix: "m", multiplier: 1e-3 }, // milli
        { prefix: "c", multiplier: 1e-2 }, // centi
        { prefix: "d", multiplier: 1e-1 }, // deci
        { prefix: "", multiplier: 1 }, // base unit
        { prefix: "da", multiplier: 1e1 }, // deka
        { prefix: "h", multiplier: 1e2 }, // hecto
        { prefix: "k", multiplier: 1e3 }, // kilo
        { prefix: "M", multiplier: 1e6 }, // mega
        { prefix: "G", multiplier: 1e9 }, // giga
        { prefix: "T", multiplier: 1e12 }, // tera
        { prefix: "P", multiplier: 1e15 }, // peta
        { prefix: "E", multiplier: 1e18 }, // exa
        { prefix: "Z", multiplier: 1e21 }, // zetta
        { prefix: "Y", multiplier: 1e24 }, // yotta
        { prefix: "R", multiplier: 1e27 }, // ronna
        { prefix: "Q", multiplier: 1e30 }, // quetta
    ];

    // Find the best prefix (closest to making the value between 1 and 999)
    // We want to find the largest prefix that keeps the value >= 1
    let bestPrefix =
        orderedPrefixes.find((p) => p.prefix === "") || orderedPrefixes[12]; // default to base unit (index 12)

    for (const prefix of orderedPrefixes.slice().reverse()) {
        // Check from largest to smallest
        const normalizedValue = actualValue / prefix.multiplier;
        if (normalizedValue >= 1 && normalizedValue < 1000) {
            bestPrefix = prefix;
            break;
        }
    }

    const normalizedValue = actualValue / bestPrefix.multiplier;

    // Format the number to remove unnecessary decimal places
    let formattedValue: string;
    if (normalizedValue % 1 === 0) {
        // Integer value
        formattedValue = normalizedValue.toString();
    } else if (normalizedValue < 10) {
        // Show 2 decimal places for values less than 10
        formattedValue = normalizedValue.toFixed(2).replace(/\.?0+$/, "");
    } else {
        // Show 1 decimal place for values 10 and above
        formattedValue = normalizedValue.toFixed(1).replace(/\.?0+$/, "");
    }

    return `${formattedValue} ${bestPrefix.prefix}${baseUnit}`;
}
