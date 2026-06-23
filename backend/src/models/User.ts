import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  githubId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  email?: string;
  githubAccessToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    githubId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true },
    displayName: { type: String },
    avatarUrl: { type: String },
    email: { type: String },
    githubAccessToken: { type: String, select: false },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
