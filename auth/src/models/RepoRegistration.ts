import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRepoRegistration extends Document {
  userId: Types.ObjectId;
  repoOwner: string;
  repoName: string;
  createdAt: Date;
  updatedAt: Date;
}

const repoRegistrationSchema = new Schema<IRepoRegistration>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    repoOwner: { type: String, required: true },
    repoName: { type: String, required: true },
  },
  { timestamps: true }
);

repoRegistrationSchema.index({ repoOwner: 1, repoName: 1 }, { unique: true });

export const RepoRegistration = mongoose.model<IRepoRegistration>(
  'RepoRegistration',
  repoRegistrationSchema
);
