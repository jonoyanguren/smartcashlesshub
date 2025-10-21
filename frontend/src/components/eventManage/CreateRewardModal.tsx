// Create Reward Modal
// Modal for creating/editing rewards

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button } from '../ui';
import { createReward, updateReward, type Reward, type CreateRewardRequest } from '../../api/rewards';

interface CreateRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId: string;
  reward?: Reward | null;
}

const CreateRewardModal = ({
  isOpen,
  onClose,
  onSuccess,
  eventId,
  reward: editReward,
}: CreateRewardModalProps) => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<'MINIMUM_SPEND' | 'TRANSACTION_COUNT'>('MINIMUM_SPEND');
  const [minimumSpend, setMinimumSpend] = useState('');
  const [minimumTransactions, setMinimumTransactions] = useState('');
  const [rewardType, setRewardType] = useState<'RECHARGE' | 'DISCOUNT_PERCENTAGE'>('RECHARGE');
  const [rewardAmount, setRewardAmount] = useState('');
  const [maxRedemptionsPerUser, setMaxRedemptionsPerUser] = useState('1');
  const [maxTotalRedemptions, setMaxTotalRedemptions] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'INACTIVE'>('DRAFT');

  useEffect(() => {
    if (editReward) {
      setName(editReward.name);
      setDescription(editReward.description || '');
      setTriggerType(editReward.triggerType as any);
      setMinimumSpend(editReward.minimumSpend?.toString() || '');
      setMinimumTransactions(editReward.minimumTransactions?.toString() || '');
      setRewardType(editReward.rewardType as any);
      setRewardAmount(editReward.rewardAmount?.toString() || '');
      setMaxRedemptionsPerUser(editReward.maxRedemptionsPerUser?.toString() || '1');
      setMaxTotalRedemptions(editReward.maxTotalRedemptions?.toString() || '');
      setStatus(editReward.status as any);
    } else {
      resetForm();
    }
  }, [editReward, isOpen]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setTriggerType('MINIMUM_SPEND');
    setMinimumSpend('');
    setMinimumTransactions('');
    setRewardType('RECHARGE');
    setRewardAmount('');
    setMaxRedemptionsPerUser('1');
    setMaxTotalRedemptions('');
    setStatus('DRAFT');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data: CreateRewardRequest = {
        eventId,
        name,
        description: description || undefined,
        triggerType,
        minimumSpend: triggerType === 'MINIMUM_SPEND' && minimumSpend ? parseFloat(minimumSpend) : undefined,
        minimumTransactions: triggerType === 'TRANSACTION_COUNT' && minimumTransactions ? parseInt(minimumTransactions) : undefined,
        rewardType,
        rewardAmount: rewardAmount ? parseFloat(rewardAmount) : undefined,
        maxRedemptionsPerUser: maxRedemptionsPerUser ? parseInt(maxRedemptionsPerUser) : 1,
        maxTotalRedemptions: maxTotalRedemptions ? parseInt(maxTotalRedemptions) : undefined,
      };

      if (editReward) {
        await updateReward(editReward.id, {
          name: data.name,
          description: data.description,
          status,
          minimumSpend: data.minimumSpend,
          minimumTransactions: data.minimumTransactions,
          rewardAmount: data.rewardAmount,
          maxRedemptionsPerUser: data.maxRedemptionsPerUser,
          maxTotalRedemptions: data.maxTotalRedemptions,
        });
      } else {
        await createReward(data);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reward');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editReward
        ? t('dashboard:rewards.edit_reward', { defaultValue: 'Edit Reward' })
        : t('dashboard:rewards.create_reward', { defaultValue: 'Create Reward' })
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('dashboard:rewards.name', { defaultValue: 'Reward Name' })} *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            placeholder="Spend 150€ Get 10€ Free"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('dashboard:rewards.description', { defaultValue: 'Description' })}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('dashboard:rewards.trigger_type', { defaultValue: 'Trigger Type' })} *
          </label>
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value as any)}
            disabled={!!editReward}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          >
            <option value="MINIMUM_SPEND">Minimum Spend</option>
            <option value="TRANSACTION_COUNT">Transaction Count</option>
          </select>
        </div>

        {triggerType === 'MINIMUM_SPEND' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard:rewards.minimum_spend', { defaultValue: 'Minimum Spend (€)' })} *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={minimumSpend}
              onChange={(e) => setMinimumSpend(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>
        )}

        {triggerType === 'TRANSACTION_COUNT' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard:rewards.minimum_transactions', { defaultValue: 'Minimum Transactions' })} *
            </label>
            <input
              type="number"
              min="1"
              value={minimumTransactions}
              onChange={(e) => setMinimumTransactions(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('dashboard:rewards.reward_type', { defaultValue: 'Reward Type' })} *
          </label>
          <select
            value={rewardType}
            onChange={(e) => setRewardType(e.target.value as any)}
            disabled={!!editReward}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          >
            <option value="RECHARGE">Recharge (add money)</option>
            <option value="DISCOUNT_PERCENTAGE">Discount Percentage</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {rewardType === 'RECHARGE'
              ? t('dashboard:rewards.recharge_amount', { defaultValue: 'Recharge Amount (€)' })
              : t('dashboard:rewards.discount_percent', { defaultValue: 'Discount (%)' })
            } *
          </label>
          <input
            type="number"
            step={rewardType === 'RECHARGE' ? '0.01' : '1'}
            min="0"
            max={rewardType === 'DISCOUNT_PERCENTAGE' ? '100' : undefined}
            value={rewardAmount}
            onChange={(e) => setRewardAmount(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard:rewards.max_per_user', { defaultValue: 'Max Per User' })}
            </label>
            <input
              type="number"
              min="1"
              value={maxRedemptionsPerUser}
              onChange={(e) => setMaxRedemptionsPerUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard:rewards.max_total', { defaultValue: 'Max Total' })}
            </label>
            <input
              type="number"
              min="1"
              value={maxTotalRedemptions}
              onChange={(e) => setMaxTotalRedemptions(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              placeholder="Unlimited"
            />
          </div>
        </div>

        {editReward && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard:rewards.status', { defaultValue: 'Status' })}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('dashboard:rewards.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading
              ? t('dashboard:rewards.saving', { defaultValue: 'Saving...' })
              : editReward
                ? t('dashboard:rewards.update', { defaultValue: 'Update' })
                : t('dashboard:rewards.create', { defaultValue: 'Create' })
            }
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateRewardModal;