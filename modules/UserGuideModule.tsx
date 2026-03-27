
import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Sparkles, 
  Clapperboard, 
  PenTool, 
  Zap, 
  ArrowRight, 
  PlayCircle, 
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface UserGuideModuleProps {
  onNavigate: (tab: 'single' | 'series' | 'story' | 'marketing') => void;
}

const UserGuideModule: React.FC<UserGuideModuleProps> = ({ onNavigate }) => {
  const guides = [
    {
      id: 'single',
      title: 'Prompt Đơn (Cinematic)',
      icon: Sparkles,
      color: 'bg-orange-500',
      description: 'Tạo prompt video AI chuyên nghiệp từ ý tưởng tiếng Việt. Tối ưu cho Jimeng, Luma, Runway.',
      steps: [
        'Nhập ý tưởng video bằng tiếng Việt.',
        'Chọn nhân vật (nếu có) để giữ tính nhất quán.',
        'Hệ thống tự động dịch và tối ưu cấu trúc prompt điện ảnh.',
        'Sao chép prompt và dán vào công cụ tạo video AI.'
      ]
    },
    {
      id: 'series',
      title: 'Phim Võ Thuật (Series)',
      icon: Clapperboard,
      color: 'bg-red-500',
      description: 'Xây dựng kịch bản phim hành động dài tập với logic va chạm vật lý cực mạnh.',
      steps: [
        'Nhập ý tưởng phim hoặc chọn từ xu hướng.',
        'Phát triển kịch bản tổng thể cho nhiều tập.',
        'Chia nhỏ từng tập thành các cảnh quay 12 giây.',
        'Tạo prompt có tính liên kết (Continuity) giữa các cảnh.'
      ]
    },
    {
      id: 'story',
      title: 'Xưởng Truyện (Story Studio)',
      icon: PenTool,
      color: 'bg-blue-500',
      description: 'Sáng tác truyện đa dạng chủ đề: Chủ tịch, Tình cảm, Kinh dị, Nấu ăn...',
      steps: [
        'Chọn chủ đề truyện mong muốn.',
        'Gợi ý ý tưởng hoặc tự nhập cốt truyện.',
        'Hệ thống viết kịch bản chi tiết kèm lời thoại nhân vật.',
        'Tạo prompt video bám sát nội dung và cảm xúc truyện.'
      ]
    },
    {
      id: 'marketing',
      title: 'Giải pháp Marketing',
      icon: Zap,
      color: 'bg-indigo-500',
      description: 'Hệ sinh thái công cụ hỗ trợ doanh nghiệp tăng trưởng doanh số tự động.',
      steps: [
        'Tìm hiểu các giải pháp Chatbot, Auto Inbox.',
        'Tối ưu hóa quy trình chăm sóc khách hàng Fanpage/Zalo.',
        'Sử dụng các công cụ gửi tin nhắn hàng loạt chuyên nghiệp.',
        'Liên hệ hỗ trợ để được tư vấn giải pháp phù hợp.'
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-6 md:py-12 space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100"
        >
          <HelpCircle className="w-4 h-4" />
          Trung tâm hỗ trợ người dùng
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
          Chào mừng đến với <span className="text-orange-500">NAM AI</span>
        </h1>
        <p className="text-slate-500 text-sm md:text-lg font-medium leading-relaxed">
          Khám phá sức mạnh của AI trong việc sáng tạo nội dung video và giải pháp Marketing. 
          Dưới đây là hướng dẫn chi tiết để bạn bắt đầu hành trình của mình.
        </p>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {guides.map((guide, index) => (
          <motion.div
            key={guide.id}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-slate-100 rounded-[40px] p-8 md:p-10 shadow-sm hover:shadow-xl transition-all group flex flex-col"
          >
            <div className="flex items-start justify-between mb-8">
              <div className={`w-16 h-16 ${guide.color} rounded-2xl flex items-center justify-center shadow-lg shadow-current/20`}>
                <guide.icon className="w-8 h-8 text-white" />
              </div>
              <button
                onClick={() => onNavigate(guide.id as any)}
                className="p-4 bg-slate-50 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-2xl transition-all group/btn"
              >
                <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-4">{guide.title}</h3>
            <p className="text-slate-500 text-sm mb-8 font-medium leading-relaxed">
              {guide.description}
            </p>

            <div className="space-y-4 mb-10 flex-grow">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Các bước thực hiện:</h4>
              {guide.steps.map((step, sIndex) => (
                <div key={sIndex} className="flex items-start gap-3">
                  <div className="mt-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  </div>
                  <span className="text-xs text-slate-600 font-bold leading-relaxed">{step}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate(guide.id as any)}
              className={`w-full py-5 ${guide.color} text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-current/20 hover:brightness-110 transition-all flex items-center justify-center gap-3 active:scale-[0.98]`}
            >
              <PlayCircle className="w-5 h-5" />
              Bắt đầu sử dụng ngay
            </button>
          </motion.div>
        ))}
      </div>

      {/* Footer Support */}
      <div className="bg-orange-50 rounded-[40px] p-8 md:p-12 border border-orange-100 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 text-center md:text-left">
          <h3 className="text-2xl font-black text-slate-800">Cần hỗ trợ thêm?</h3>
          <p className="text-slate-500 text-sm font-medium max-w-md">
            Nếu bạn gặp bất kỳ khó khăn nào trong quá trình sử dụng, đừng ngần ngại liên hệ với đội ngũ kỹ thuật của chúng tôi.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="https://zalo.me/0981028794"
            target="_blank"
            rel="noreferrer"
            className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all text-center"
          >
            Hỗ trợ Zalo
          </a>
          <div className="px-10 py-4 bg-white border border-orange-200 text-orange-600 rounded-2xl font-black uppercase tracking-widest text-xs text-center">
            Hotline: 098.102.8794
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuideModule;
