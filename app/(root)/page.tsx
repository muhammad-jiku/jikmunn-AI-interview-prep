import InterviewCard from '@/components/shared/InterviewCard';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import {
  getInterviewsByUserId,
  getLatestInterviews,
} from '@/lib/actions/general.actions';
import Image from 'next/image';
import Link from 'next/link';
import SignInPage from '../(auth)/sign-in/page';

async function Home() {
  const user = await getCurrentUser();

  // Handle the case when user is not logged in
  if (!user) {
    // You might want to return a different UI for non-authenticated users
    return <SignInPage />;
  }

  // Now we can safely use user.id because we've confirmed user exists
  const [userInterviews, allInterview] = await Promise.all([
    getInterviewsByUserId(user.id),
    getLatestInterviews({ userId: user.id }),
  ]);

  // Use optional chaining with fallback instead of non-null assertion
  // const hasPastInterviews = userInterviews!.length > 0 || false;
  // const hasUpcomingInterviews = allInterview!.length > 0 || false;
  const hasPastInterviews = userInterviews && userInterviews.length > 0;
  const hasUpcomingInterviews = allInterview && allInterview.length > 0;

  return (
    <>
      {console.log('upcoming interviews', hasUpcomingInterviews)}
      {console.log('user', user)}
      {console.log('upcoming all interviews', allInterview)}
      <section className='card-cta'>
        <div className='flex flex-col gap-6 max-w-lg'>
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className='text-lg'>
            Practice real interview questions & get instant feedback
          </p>
          <Button asChild className='btn-primary max-sm:w-full'>
            <Link href='/interview'>Start an Interview</Link>
          </Button>
        </div>
        <Image
          src='/images/robot.png'
          alt='robo-dude'
          width={400}
          height={400}
          className='max-sm:hidden'
        />
      </section>
      <section className='flex flex-col gap-6 mt-8'>
        <h2>Your Interviews</h2>
        <div className='interviews-section'>
          {hasPastInterviews ? (
            userInterviews?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>You haven&apos;t taken any interviews yet</p>
          )}
        </div>
      </section>
      <section className='flex flex-col gap-6 mt-8'>
        <h2>Take Interviews</h2>
        <div className='interviews-section'>
          {hasUpcomingInterviews ? (
            allInterview?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>There are no interviews available</p>
          )}
        </div>
      </section>
    </>
  );
}

export default Home;
