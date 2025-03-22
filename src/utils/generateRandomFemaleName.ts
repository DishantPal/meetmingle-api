const FEMALE_NAMES = [
    "Jessica", "Amanda", "Ashley", "Melissa", "Jennifer", "Sarah", "Stephanie", "Nicole", "Amber", "Rachel",
    "Heather", "Elizabeth", "Brittany", "Rebecca", "Tiffany", "Christina", "Michelle", "Samantha", "Megan", "Danielle",
    "Kayla", "Lauren", "Chelsea", "Taylor", "Katherine", "Erica", "Allison", "Vanessa", "Whitney", "Morgan",
    "Sofia", "Emma", "Anastasia", "Isabella", "Natalia", "Camille", "Victoria", "Charlotte", "Elena", "Olivia",
    "Sophia", "Clara", "Valentina", "Alessia", "Mila", "Lucia", "Emilia", "Viktoria", "Amelia", "Elise",
    "Zoe", "Chloe", "Adeline", "Ines", "Maya", "Leila", "Stella", "Elsa", "Lena", "Francesca",
    "Priya", "Neha", "Anjali", "Pooja", "Divya", "Aishwarya", "Shruti", "Nisha", "Ananya", "Kavita",
    "Meera", "Jasmine", "Seema", "Riya", "Tanya", "Sonia", "Maya", "Aditi", "Sneha", "Shweta",
    "Jyoti", "Deepika", "Manisha", "Aarti", "Lakshmi", "Kiran", "Anika", "Leela", "Tara", "Shalini",
    "Leila", "Zara", "Maya", "Lara", "Nina", "Mia", "Layla", "Natasha", "Anya", "Sasha"
];


export const getRandomFemaleName = () => {
    const randomIndex = Math.floor(Math.random() * FEMALE_NAMES.length);
    return FEMALE_NAMES[randomIndex] || "Helly";
};