import { SajuInfo } from "@/types/user";

export function calculateSaju(birthDate: string): SajuInfo {
    // Simple mock implementation based on birth year and day
    // Real implementation would require complex lunar calendar conversion

    const date = new Date(birthDate);
    const year = date.getFullYear();
    const day = date.getDate();

    const elements: SajuInfo['element'][] = ['WOOD', 'FIRE', 'EARTH', 'METAL', 'WATER'];
    const animals = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Sheep', 'Monkey', 'Rooster', 'Dog', 'Pig'];

    // Year based logic (simple modulo)
    const elementIndex = (year - 4) % 10 / 2 | 0; // Heavenly stems approximation
    const animalIndex = (year - 4) % 12;

    // Day based luck
    const lucks = [
        "Great fortune awaits in the tech sector.",
        "Conservative investments will yield steady growth.",
        "Expand your portfolio into emerging markets.",
        "Beware of volatile assets this month.",
        "A golden opportunity is approaching."
    ];

    return {
        element: elements[elementIndex % 5],
        animal: animals[animalIndex],
        luck: lucks[day % 5]
    };
}
