import { getAllMovies, getMovieById } from '../services/movieService.js';

export const getMovies = async (req, res, next) => {
  try {
    const movies = await getAllMovies(req.query);
    res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};

export const getMovie = async (req, res, next) => {
  try {
    const movie = await getMovieById(req.params.id);
    res.status(200).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    res.status(404);
    next(error);
  }
};
