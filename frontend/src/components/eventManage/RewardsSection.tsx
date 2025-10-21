// Rewards Section
// Manage event rewards (automatic promotions)

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, LoadingState } from '../ui';
import { listRewards, deleteReward, type Reward } from '../../api/rewards';
import CreateRewardModal from './CreateRewardModal';

interface RewardsSectionProps {
  eventId: string;
}

const RewardsSection = ({ eventId }: RewardsSectionProps) => {
  const { t } = useTranslation(['dashboard']);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  useEffect(() => {
    loadRewards();
  }, [eventId]);

  const loadRewards = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listRewards({ eventId });
      setRewards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rewards');
      console.error('Error loading rewards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (rewardId: string) => {
    if (!confirm(t('dashboard:rewards.confirm_delete', { defaultValue: 'Are you sure you want to delete this reward?' }))) {
      return;
    }

    try {
      await deleteReward(rewardId);
      await loadRewards();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete reward');
    }
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingReward(null);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-yellow-100 text-yellow-800',
      EXPIRED: 'bg-red-100 text-red-800',
      DEPLETED: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTriggerLabel = (reward: Reward) => {
    if (reward.triggerType === 'MINIMUM_SPEND' && reward.minimumSpend) {
      return `Spend €${reward.minimumSpend.toFixed(2)}`;
    }
    if (reward.triggerType === 'TRANSACTION_COUNT' && reward.minimumTransactions) {
      return `${reward.minimumTransactions} transactions`;
    }
    return reward.triggerType;
  };

  const getRewardLabel = (reward: Reward) => {
    if (reward.rewardType === 'RECHARGE' && reward.rewardAmount) {
      return `Get €${reward.rewardAmount.toFixed(2)}`;
    }
    if (reward.rewardType === 'DISCOUNT_PERCENTAGE' && reward.rewardAmount) {
      return `${reward.rewardAmount}% off`;
    }
    return reward.rewardType;
  };

  if (loading) {
    return <LoadingState message={t('dashboard:rewards.loading', { defaultValue: 'Loading rewards...' })} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t('dashboard:rewards.title', { defaultValue: 'Rewards' })}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t('dashboard:rewards.subtitle', { defaultValue: 'Automatic rewards during the event' })}
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('dashboard:rewards.create', { defaultValue: 'Create Reward' })}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Rewards List */}
      {rewards.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {t('dashboard:rewards.no_rewards', { defaultValue: 'No rewards' })}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('dashboard:rewards.no_rewards_desc', { defaultValue: 'Get started by creating a new reward.' })}
          </p>
          <div className="mt-6">
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              {t('dashboard:rewards.create', { defaultValue: 'Create Reward' })}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => (
            <div key={reward.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{reward.name}</h3>
                    {reward.description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{reward.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(reward.status)}`}>
                    {reward.status}
                  </span>
                </div>

                {/* Trigger & Reward */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-gray-600">{t('dashboard:rewards.trigger', { defaultValue: 'Trigger' })}:</span>
                    <span className="font-semibold text-gray-900">{getTriggerLabel(reward)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-600">{t('dashboard:rewards.reward', { defaultValue: 'Reward' })}:</span>
                    <span className="font-semibold text-accent-600">{getRewardLabel(reward)}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{t('dashboard:rewards.redeemed', { defaultValue: 'Redeemed' })}</span>
                    <p className="font-semibold text-gray-900">
                      {reward.currentRedemptions} {reward.maxTotalRedemptions ? `/ ${reward.maxTotalRedemptions}` : ''}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('dashboard:rewards.per_user', { defaultValue: 'Per User' })}</span>
                    <p className="font-semibold text-gray-900">{reward.maxRedemptionsPerUser || '∞'}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200 flex gap-2">
                  <Button variant="outline" size="sm" fullWidth onClick={() => handleEdit(reward)}>
                    {t('dashboard:rewards.edit', { defaultValue: 'Edit' })}
                  </Button>
                  <Button variant="ghost" size="sm" fullWidth onClick={() => handleDelete(reward.id)}>
                    {t('dashboard:rewards.delete', { defaultValue: 'Delete' })}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreateRewardModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSuccess={() => {
          loadRewards();
          handleCloseModal();
        }}
        eventId={eventId}
        reward={editingReward}
      />
    </div>
  );
};

export default RewardsSection;