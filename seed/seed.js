import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Movie from '../models/Movie.js';
import Theater from '../models/Theater.js';
import Showtime from '../models/Showtime.js';
import Booking from '../models/Booking.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const sampleMovies = [
  {
    title: 'Dune: Part Two',
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.',
    genre: ['Sci-Fi', 'Adventure', 'Action'],
    duration: 166,
    releaseDate: new Date('2024-03-01'),
    censorRating: 'UA',
    languages: ['English', 'Hindi', 'Tamil'],
    rating: 8.8,
    formats: ['2D', '3D', 'IMAX 3D', '4DX'],
    cast: [
      { name: 'Timothée Chalamet', role: 'Paul Atreides' },
      { name: 'Zendaya', role: 'Chani' },
      { name: 'Rebecca Ferguson', role: 'Lady Jessica' },
      { name: 'Javier Bardem', role: 'Stilgar' },
    ],
  },
  {
    title: 'Oppenheimer',
    poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
    genre: ['Biography', 'Drama', 'History'],
    duration: 180,
    releaseDate: new Date('2023-07-21'),
    censorRating: 'A',
    languages: ['English', 'Hindi'],
    rating: 8.9,
    formats: ['2D', 'IMAX 2D'],
    cast: [
      { name: 'Cillian Murphy', role: 'J. Robert Oppenheimer' },
      { name: 'Emily Blunt', role: 'Katherine Oppenheimer' },
      { name: 'Matt Damon', role: 'Leslie Groves' },
      { name: 'Robert Downey Jr.', role: 'Lewis Strauss' },
    ],
  },
  {
    title: 'Spider-Man: Across the Spider-Verse',
    poster: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=1200&auto=format&fit=crop&q=80',
    description: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
    genre: ['Animation', 'Action', 'Adventure'],
    duration: 140,
    releaseDate: new Date('2023-06-02'),
    censorRating: 'U',
    languages: ['English', 'Hindi', 'Telugu'],
    rating: 8.7,
    formats: ['2D', '3D', '4DX'],
    cast: [
      { name: 'Shameik Moore', role: 'Miles Morales' },
      { name: 'Hailee Steinfeld', role: 'Gwen Stacy' },
      { name: 'Oscar Isaac', role: 'Miguel O\'Hara' },
    ],
  },
  {
    title: 'The Dark Knight',
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&auto=format&fit=crop&q=80',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    genre: ['Action', 'Crime', 'Drama'],
    duration: 152,
    releaseDate: new Date('2008-07-18'),
    censorRating: 'UA',
    languages: ['English', 'Hindi'],
    rating: 9.0,
    formats: ['2D', 'IMAX 2D'],
    cast: [
      { name: 'Christian Bale', role: 'Bruce Wayne / Batman' },
      { name: 'Heath Ledger', role: 'Joker' },
      { name: 'Aaron Eckhart', role: 'Harvey Dent' },
    ],
  },
  {
    title: 'Interstellar',
    poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80',
    description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
    genre: ['Sci-Fi', 'Drama', 'Adventure'],
    duration: 169,
    releaseDate: new Date('2014-11-07'),
    censorRating: 'U',
    languages: ['English', 'Hindi'],
    rating: 8.7,
    formats: ['2D', 'IMAX 2D', '70MM'],
    cast: [
      { name: 'Matthew McConaughey', role: 'Cooper' },
      { name: 'Anne Hathaway', role: 'Brand' },
      { name: 'Jessica Chastain', role: 'Murph' },
    ],
  },
];

// Helper to generate seat grid: Rows A-C (Normal), D-F (Executive), G-H (VIP)
const generateSeatGrid = () => {
  const seats = [];
  const rowsConfig = [
    { row: 'A', tier: 'NORMAL' },
    { row: 'B', tier: 'NORMAL' },
    { row: 'C', tier: 'NORMAL' },
    { row: 'D', tier: 'EXECUTIVE' },
    { row: 'E', tier: 'EXECUTIVE' },
    { row: 'F', tier: 'EXECUTIVE' },
    { row: 'G', tier: 'VIP' },
    { row: 'H', tier: 'VIP' },
  ];

  rowsConfig.forEach(({ row, tier }) => {
    for (let col = 1; col <= 10; col++) {
      seats.push({
        seatId: `${row}${col}`,
        row,
        column: col,
        tier,
      });
    }
  });

  return seats;
};

const sampleTheaters = [
  {
    name: 'PVR Director\'s Cut, Select CITYWALK',
    city: 'Delhi',
    address: 'A-3 District Centre, Saket, New Delhi',
    screens: [
      {
        name: 'Screen 1 (IMAX)',
        screenNumber: 1,
        capacity: 80,
        seats: generateSeatGrid(),
      },
      {
        name: 'Screen 2 (LUXE)',
        screenNumber: 2,
        capacity: 80,
        seats: generateSeatGrid(),
      },
    ],
  },
  {
    name: 'INOX Megaplex, Mall of India',
    city: 'Noida',
    address: 'Sector 18, Noida, Uttar Pradesh',
    screens: [
      {
        name: 'AUDI 1 (4DX)',
        screenNumber: 1,
        capacity: 80,
        seats: generateSeatGrid(),
      },
      {
        name: 'AUDI 2 (IMAX 3D)',
        screenNumber: 2,
        capacity: 80,
        seats: generateSeatGrid(),
      },
    ],
  },
  {
    name: 'Cinépolis VIP, DLF Avenue',
    city: 'Delhi',
    address: 'Press Enclave Marg, Saket, New Delhi',
    screens: [
      {
        name: 'VIP Screen 1',
        screenNumber: 1,
        capacity: 80,
        seats: generateSeatGrid(),
      },
    ],
  },
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/realtime_movie_booking';
    console.log(`Connecting to MongoDB for seeding at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Movie.deleteMany({});
    await Theater.deleteMany({});
    await Showtime.deleteMany({});
    await Booking.deleteMany({});

    console.log('Seeding default user...');
    const defaultUser = await User.create({
      name: 'John Doe',
      email: 'user@example.com',
      password: 'password123',
      role: 'USER',
    });

    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'adminpassword123',
      role: 'ADMIN',
    });

    console.log('Seeding movies...');
    const insertedMovies = await Movie.insertMany(sampleMovies);

    console.log('Seeding theaters...');
    const insertedTheaters = await Theater.insertMany(sampleTheaters);

    console.log('Seeding showtimes...');
    const showtimesToInsert = [];

    // Helper to get formatted date string YYYY-MM-DD
    const getDateString = (offsetDays) => {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().split('T')[0];
    };

    const dates = [getDateString(0), getDateString(1), getDateString(2)];
    const times = ['10:30 AM', '02:15 PM', '06:00 PM', '09:45 PM'];

    // Map showtimes for each movie and theater combination across dates
    insertedMovies.forEach((movie, mIdx) => {
      insertedTheaters.forEach((theater, tIdx) => {
        const screen = theater.screens[0];
        dates.forEach((dateStr) => {
          times.forEach((timeStr, timeIdx) => {
            // Assign varied pricing
            showtimesToInsert.push({
              movie: movie._id,
              theater: theater._id,
              screenId: screen._id.toString(),
              screenName: screen.name,
              format: movie.formats[timeIdx % movie.formats.length] || '2D',
              language: movie.languages[0] || 'English',
              date: dateStr,
              startTime: timeStr,
              basePricing: {
                NORMAL: 220 + (tIdx * 30),
                EXECUTIVE: 380 + (tIdx * 30),
                VIP: 550 + (tIdx * 50),
              },
            });
          });
        });
      });
    });

    await Showtime.insertMany(showtimesToInsert);

    console.log('\n========================================');
    console.log('DATABASE SEEDED SUCCESSFULLY!');
    console.log(`Movies inserted: ${insertedMovies.length}`);
    console.log(`Theaters inserted: ${insertedTheaters.length}`);
    console.log(`Showtimes inserted: ${showtimesToInsert.length}`);
    console.log(`Default Login: user@example.com / password123`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
