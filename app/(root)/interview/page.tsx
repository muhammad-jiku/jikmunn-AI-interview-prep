/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import Agent from '@/components/shared/Agent';
import { getCurrentUser } from '@/lib/actions/auth.actions';

const Page = async () => {
  const user = await getCurrentUser();

  return (
    <>
      <h3>Interview generation</h3>

      <Agent
        userName={user?.name!}
        userId={user?.id}
        profileImage={user?.profileURL as string}
        type='generate'
      />
    </>
  );
};

export default Page;
