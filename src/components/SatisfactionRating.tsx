import { useState } from 'react';
import { Button, Textarea, MessagePlugin } from 'tdesign-react';
import { StarFilledIcon, StarIcon } from 'tdesign-icons-react';

interface SatisfactionRatingProps {
  sessionId: string;
  onSubmit?: () => void;
  onClose?: () => void;
}

export function SatisfactionRating({ sessionId, onSubmit, onClose }: SatisfactionRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      MessagePlugin.warning('请选择评分');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/satisfaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback: feedback.trim() || null })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '提交失败');
      }

      setSubmitted(true);
      MessagePlugin.success('感谢您的评价！');
      onSubmit?.();
    } catch (error: any) {
      MessagePlugin.error(error.message || '提交评价失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 text-center">
        <div className="text-success mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-1">感谢您的评价！</h3>
        <p className="text-sm text-gray-500 mb-4">您的反馈将帮助我们改进服务</p>
        <Button theme="primary" onClick={onClose}>
          关闭
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-medium mb-4 text-center">请对本次服务进行评价</h3>

      {/* 星级评分 */}
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className="p-1 transition-transform hover:scale-110 focus:outline-none"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
          >
            {star <= (hoverRating || rating) ? (
              <StarFilledIcon className="w-8 h-8 text-warning" />
            ) : (
              <StarIcon className="w-8 h-8 text-gray-300" />
            )}
          </button>
        ))}
      </div>

      {/* 评分标签 */}
      <div className="text-center mb-4">
        {rating > 0 && (
          <span className="text-sm font-medium" style={{ color: 'var(--td-brand-color)' }}>
            {rating === 5 && '非常满意'}
            {rating === 4 && '满意'}
            {rating === 3 && '一般'}
            {rating === 2 && '不满意'}
            {rating === 1 && '非常不满意'}
          </span>
        )}
      </div>

      {/* 反馈输入 */}
      <div className="mb-4">
        <Textarea
          placeholder="请输入您的宝贵意见（选填）"
          value={feedback}
          onChange={(value) => setFeedback(value)}
          maxlength={200}
          showLimit
          rows={3}
        />
      </div>

      {/* 按钮 */}
      <div className="flex justify-center gap-3">
        <Button theme="default" onClick={onClose}>
          暂不评价
        </Button>
        <Button
          theme="primary"
          loading={submitting}
          onClick={handleSubmit}
        >
          提交评价
        </Button>
      </div>
    </div>
  );
}
