import mongoose from 'mongoose';

const castMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  image: { type: String, default: '' },
});

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
    },
    poster: {
      type: String,
      required: [true, 'Poster image URL is required'],
    },
    banner: {
      type: String,
      required: [true, 'Banner image URL is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    genre: [{ type: String, required: true }],
    duration: {
      type: Number, // In minutes
      required: [true, 'Duration in minutes is required'],
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
    },
    censorRating: {
      type: String,
      enum: ['U', 'UA', 'A', 'S'],
      default: 'UA',
    },
    languages: [{ type: String, required: true }],
    cast: [castMemberSchema],
    trailerUrl: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 8.5,
      min: 0,
      max: 10,
    },
    formats: [{ type: String, enum: ['2D', '3D', 'IMAX 2D', 'IMAX 3D', '4DX', '70MM', 'LUXE'] }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Movie', movieSchema);
