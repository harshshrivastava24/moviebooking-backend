import Movie from '../models/Movie.js';

export const getAllMovies = async (query = {}) => {
  const { genre, language, search, format } = query;
  const filter = {};

  if (genre) {
    filter.genre = { $in: [new RegExp(genre, 'i')] };
  }

  if (language) {
    filter.languages = { $in: [new RegExp(language, 'i')] };
  }

  if (format) {
    filter.formats = { $in: [format] };
  }

  if (search) {
    filter.title = { $regex: search, $options: 'i' };
  }

  const movies = await Movie.find(filter).sort({ releaseDate: -1 });
  return movies;
};

export const getMovieById = async (movieId) => {
  const movie = await Movie.findById(movieId);
  if (!movie) {
    throw new Error('Movie not found');
  }
  return movie;
};
