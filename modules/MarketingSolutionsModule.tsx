
import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, MessageCircle, Mail, Zap, ExternalLink, ShieldCheck, BarChart3, Users } from 'lucide-react';

const SOLUTIONS = [
  {
    title: 'Fchat - Chatbot & Marketing Automation',
    description: 'Giải pháp Chatbot tự động trả lời tin nhắn, chốt đơn và chăm sóc khách hàng 24/7 trên Facebook, Zalo, Website.',
    link: 'https://fchat.vn?ref=namlv',
    icon: MessageCircle,
    color: 'bg-blue-500',
    features: ['Tự động trả lời tin nhắn', 'Quản lý đơn hàng tập trung', 'Gửi tin nhắn hàng loạt']
  },
  {
    title: 'Facebook AutoInbox',
    description: 'Gửi tin nhắn hàng loạt cho khách cũ trên FANPAGE với nội dung chứa quảng cáo kèm ảnh, Link!',
    link: 'https://fbinbox.net/?ref=namlv',
    icon: Mail,
    color: 'bg-indigo-500',
    features: ['Gửi tin nhắn hàng loạt', 'Kèm ảnh & Link quảng cáo', 'Chăm sóc khách cũ tự động']
  },
  {
    title: 'Zinbox - Giải pháp Marketing Zalo chuyên nghiệp',
    description: 'Công cụ hỗ trợ gửi tin nhắn Zalo hàng loạt, quản lý danh sách bạn bè và chăm sóc khách hàng trên nền tảng Zalo hiệu quả.',
    link: 'https://zinbox.net/?ref=namlv',
    icon: Zap,
    color: 'bg-orange-500',
    features: ['Gửi tin nhắn Zalo hàng loạt', 'Kết bạn tự động', 'Chăm sóc khách hàng cũ']
  }
];

const MarketingSolutionsModule: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-2 md:px-4 py-6 md:py-12 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100"
        >
          <Rocket className="w-4 h-4" />
          Giải pháp tăng trưởng doanh nghiệp
        </motion.div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight">
          Giải Pháp Marketing <span className="text-orange-500">Toàn Diện</span> Cho Doanh Nghiệp
        </h1>
        <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed">
          Tối ưu hóa quy trình bán hàng, tự động hóa chăm sóc khách hàng và bùng nổ doanh số với hệ sinh thái công cụ Marketing hàng đầu.
        </p>
      </div>

      {/* Solutions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {SOLUTIONS.map((solution, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all group relative overflow-hidden flex flex-col"
          >
            <div className={`w-16 h-16 ${solution.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-current/20`}>
              <solution.icon className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="text-xl font-black text-slate-800 mb-4 group-hover:text-orange-500 transition-colors">
              {solution.title}
            </h3>
            
            <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow">
              {solution.description}
            </p>

            <div className="space-y-3 mb-8">
              {solution.features.map((feature, fIndex) => (
                <div key={fIndex} className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  {feature}
                </div>
              ))}
            </div>

            <a
              href={solution.link}
              target="_blank"
              rel="noreferrer"
              className="w-full py-4 bg-slate-50 text-slate-800 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2 group/btn"
            >
              Xem chi tiết
              <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
            </a>
          </motion.div>
        ))}
      </div>

      {/* Why Choose Us */}
      <div className="bg-white border border-orange-100 rounded-[60px] p-10 md:p-20 relative overflow-hidden shadow-2xl shadow-orange-500/5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-10">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                Tại sao nên chọn giải pháp của chúng tôi?
              </h2>
              <p className="text-slate-600 text-sm md:text-lg leading-relaxed max-w-lg font-medium">
                Chúng tôi cung cấp những công cụ mạnh mẽ nhất để giúp doanh nghiệp của bạn chuyển đổi số thành công và tối ưu hóa chi phí vận hành.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-12 md:gap-24">
              <div className="space-y-1">
                <div className="text-5xl font-black text-orange-500">10k+</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Khách hàng tin dùng</div>
              </div>
              <div className="space-y-1">
                <div className="text-5xl font-black text-orange-500">24/7</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hỗ trợ kỹ thuật</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { title: 'Tăng doanh số', icon: BarChart3, desc: 'Tối ưu tỷ lệ chuyển đổi' },
              { title: 'Tiết kiệm thời gian', icon: Zap, desc: 'Tự động hóa quy trình' },
              { title: 'Quản lý dễ dàng', icon: Users, desc: 'Giao diện thân thiện' },
              { title: 'Bảo mật tuyệt đối', icon: ShieldCheck, desc: 'Dữ liệu an toàn' }
            ].map((item, i) => (
              <div key={i} className="bg-orange-50/30 border border-orange-100 p-10 rounded-[40px] space-y-4 hover:bg-white hover:shadow-xl hover:shadow-orange-500/10 transition-all group">
                <item.icon className="w-8 h-8 text-orange-500" />
                <div className="space-y-1">
                  <h4 className="font-black text-lg text-slate-800 group-hover:text-orange-500 transition-colors">{item.title}</h4>
                  <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingSolutionsModule;
