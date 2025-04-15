'use server';

import { feedbackSchema } from '@/constants';
import { db } from '@/firebase/admin';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join('');

    const { object } = await generateObject({
      model: google('gemini-2.0-flash-exp', {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        'You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories',
    });

    const feedback = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    let feedbackRef;

    if (feedbackId) {
      feedbackRef = db.collection('feedback').doc(feedbackId);
    } else {
      feedbackRef = db.collection('feedback').doc();
    }

    await feedbackRef.set(feedback);

    return {
      success: true,
      feedbackId: feedbackRef.id,
    };
  } catch (error) {
    console.error('Error saving feedback:', error);
    return {
      success: false,
    };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await db.collection('interviews').doc(id).get();
  console.log('interview by id', interview);
  console.log('interview data by id', interview.data());

  return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await db
    .collection('feedback')
    .where('interviewId', '==', interviewId)
    .where('userId', '==', userId)
    .limit(1)
    .get();

  if (querySnapshot.empty) return null;

  const feedbackDoc = querySnapshot.docs[0];
  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

export async function getInterviewsByUserId(
  userId: string | undefined
): Promise<Interview[] | null> {
  // Return empty array if userId is undefined
  if (!userId) return [];

  const interviews = await db
    .collection('interviews')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  console.log('interviews by userId', interviews);

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  // try {
  //   // Return all interviews if userId is undefined
  // if (!userId) {
  //   const interviews = await db
  //     .collection('interviews')
  //     .where('finalized', '==', true)
  //     .orderBy('createdAt', 'desc')
  //     .limit(limit)
  //     .get();

  //   console.log('interviews by userId', interviews);
  //   console.log(
  //     'interviews data by userId',
  //     interviews.docs.map((doc) => doc.data())
  //   );

  //   return interviews.docs.map((doc) => ({
  //     id: doc.id,
  //     ...doc.data(),
  //   })) as Interview[];
  // }

  //   // Use the composite index query when userId is available
  // const interviews = await db
  //   .collection('interviews')
  //   .where('finalized', '==', true)
  //   .where('userId', '!=', userId)
  //   .orderBy('userId')
  //   .orderBy('createdAt', 'desc')
  //   .limit(limit)
  //   .get();

  // console.log('interviews by userId', interviews);
  // console.log(
  //   'interviews data by userId',
  //   interviews.docs.map((doc) => doc.data())
  // );

  /* return interviews.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Interview[]; */
  // } catch (error) {
  //   console.error('Error fetching interviews:', error);
  //   return [];
  // }

  const interviews = await db
    .collection('interviews')
    .where('finalized', '==', true)
    .where('userId', '!=', userId)
    .orderBy('userId')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}
