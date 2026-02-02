// src/lib/community/contribution-system.js
export class ContributionSystem {
  constructor() {
    this.rewards = {
      brokerDiscovery: 10,
      guideContribution: 5,
      codeContribution: 20,
      bugReport: 3
    };
  }

  async submitBroker(brokerData, userId) {
    // Validate broker
    const isValid = await this.validateBroker(brokerData);
    if (!isValid) throw new Error('Invalid broker data');

    // Add to pending submissions
    const { data: submission } = await supabase
      .from('broker_submissions')
      .insert([{
        ...brokerData,
        submitted_by: userId,
        status: 'pending_review',
        votes: 0,
        verification_status: 'unverified'
      }])
      .select()
      .single();

    // Start community voting
    await this.startVotingPeriod(submission.id);
    
    return {
      submission,
      reward: this.rewards.brokerDiscovery,
      nextSteps: 'Share with community for voting'
    };
  }

  async startVotingPeriod(submissionId) {
    // Create voting thread
    const { data: thread } = await supabase
      .from('community_threads')
      .insert([{
        type: 'broker_voting',
        submission_id: submissionId,
        ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }])
      .select()
      .single();

    // Notify community
    await this.notifyCommunity({
      type: 'new_broker_submission',
      thread_id: thread.id,
      submission_id: submissionId
    });
  }

  async voteOnSubmission(submissionId, userId, vote) {
    // Check if user can vote
    const canVote = await this.checkVotingEligibility(userId);
    if (!canVote) throw new Error('Not eligible to vote');

    // Record vote
    const { data: voteRecord } = await supabase
      .from('community_votes')
      .upsert({
        submission_id: submissionId,
        user_id: userId,
        vote: vote ? 1 : -1,
        voted_at: new Date().toISOString()
      }, { onConflict: 'submission_id,user_id' })
      .select()
      .single();

    // Update submission score
    await supabase.rpc('update_submission_score', {
      submission_id: submissionId
    });

    // Check if voting period ended
    await this.checkVotingResult(submissionId);

    return voteRecord;
  }
}
