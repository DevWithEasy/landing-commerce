<!DOCTYPE html>
<html lang="bn" class="scroll-smooth">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ $storeName }} - অনলাইন শপ</title>
    <meta name="description" content="সেরা দামে প্রিমিয়াম কোয়ালিটি পণ্য কিনুন {{ $storeName }}-এ। দ্রুত ক্যাশ অন ডেলিভারি সুবিধা সারা বাংলাদেশে।">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

    @vite(['resources/css/app.css'])

    <style>
        :root {
            --primary-color: {{ e($primaryColor ?? '#4f46e5') }};
        }
        body {
            font-family: 'Hind Siliguri', 'Inter', sans-serif;
        }
    </style>
</head>
<body class="bg-gray-50 text-gray-900 min-h-screen flex flex-col justify-between">
    <!-- Navigation Bar -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div class="flex items-center space-x-6">
                <a href="/" class="flex items-center space-x-3">
                    @if(!empty($logoUrl))
                        <img src="{{ e($logoUrl) }}" alt="{{ e($storeName) }}" class="h-10 w-auto">
                    @else
                        <span class="text-2xl font-black tracking-tight text-indigo-600">{{ $storeName }}</span>
                    @endif
                </a>
            </div>

            <div class="flex items-center space-x-4">
                @if(!empty($storePhone))
                    <a href="tel:{{ $storePhone }}" class="hidden sm:inline-flex items-center text-sm font-semibold text-gray-700 hover:text-indigo-600 transition">
                        <span>📞 {{ $storePhone }}</span>
                    </a>
                @endif
                @if(!empty($storeWhatsapp))
                    <a href="https://wa.me/{{ preg_replace('/[^0-9]/', '', $storeWhatsapp) }}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition">
                        <span>WhatsApp অর্ডার</span>
                    </a>
                @endif
            </div>
        </div>

        <!-- Categories Bar -->
        @if(isset($categories) && count($categories) > 0)
            <div class="bg-gray-100 border-t border-gray-200 px-4 py-2 hidden md:block">
                <div class="max-w-7xl mx-auto flex items-center space-x-6 overflow-x-auto text-sm font-medium text-gray-700">
                    <span class="text-xs uppercase font-bold text-gray-400">ক্যাটাগরি:</span>
                    @foreach($categories as $category)
                        <span class="hover:text-indigo-600 cursor-pointer whitespace-nowrap">{{ $category->name }}</span>
                    @endforeach
                </div>
            </div>
        @endif
    </header>

    <!-- Main Content Area -->
    <main class="flex-1">
        <!-- Hero Section Placeholder (Prepared for Phase 8 Sliders) -->
        <section class="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 text-white py-16 sm:py-24 px-4 text-center">
            <div class="max-w-4xl mx-auto">
                <h1 class="text-4xl sm:text-6xl font-black tracking-tight mb-4">
                    {{ $storeName }}
                </h1>
                <p class="text-lg sm:text-xl text-indigo-200 max-w-2xl mx-auto mb-8 font-light">
                    প্রিমিয়াম কোয়ালিটি পণ্য, আকর্ষণীয় ডিসকাউন্ট ও দ্রুততম ক্যাশ অন ডেলিভারি।
                </p>
                <div class="flex flex-wrap justify-center gap-4">
                    @if(!empty($storeWhatsapp))
                        <a href="https://wa.me/{{ preg_replace('/[^0-9]/', '', $storeWhatsapp) }}" target="_blank" rel="noopener noreferrer" class="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg transition transform hover:-translate-y-0.5">
                            সরাসরি যোগাযোগ করুন
                        </a>
                    @endif
                </div>
            </div>
        </section>

        <!-- Categories Grid -->
        @if(isset($categories) && count($categories) > 0)
            <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div class="text-center mb-10">
                    <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900">জনপ্রিয় ক্যাটাগরি</h2>
                    <p class="text-gray-500 mt-2 text-sm">আপনার পছন্দের ক্যাটাগরি বেছে নিন</p>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    @foreach($categories as $cat)
                        <div class="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm hover:shadow-md transition text-center group cursor-pointer">
                            <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl group-hover:scale-105 transition">
                                @if(!empty($cat->image_url))
                                    <img src="{{ $cat->image_url }}" alt="{{ $cat->name }}" class="w-full h-full object-cover rounded-full">
                                @else
                                    {{ mb_substr($cat->name, 0, 1) }}
                                @endif
                            </div>
                            <h3 class="font-semibold text-gray-900 group-hover:text-indigo-600 transition text-sm">
                                {{ $cat->name }}
                            </h3>
                            @if(isset($cat->products_count) && $cat->products_count > 0)
                                <span class="text-xs text-gray-400 mt-1 block">{{ $cat->products_count }} টি পণ্য</span>
                            @endif
                        </div>
                    @endforeach
                </div>
            </section>
        @endif
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                    <h4 class="text-lg font-bold text-gray-900 mb-3">{{ $storeName }}</h4>
                    <p class="text-sm text-gray-600 leading-relaxed">
                        দেশজুড়ে শতভাগ আসল পণ্য ও বিশ্বস্ত ডেলিভারি সেবা।
                    </p>
                </div>
                <div>
                    <h4 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">গুরুত্বপূর্ণ লিংক</h4>
                    <ul class="space-y-2 text-sm text-gray-600">
                        <li><a href="/pages/privacy-policy" class="hover:text-indigo-600 transition">গোপনীয়তা নীতি</a></li>
                        <li><a href="/pages/terms" class="hover:text-indigo-600 transition">শর্তাবলী</a></li>
                        <li><a href="/pages/refund-policy" class="hover:text-indigo-600 transition">রিটার্ন ও রিফান্ড নীতি</a></li>
                        <li><a href="/pages/about" class="hover:text-indigo-600 transition">আমাদের সম্পর্কে</a></li>
                        <li><a href="/pages/contact" class="hover:text-indigo-600 transition">যোগাযোগ</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">গ্রাহকসেবা</h4>
                    <p class="text-sm text-gray-600">হটলাইন: {{ $storePhone ?: 'উপলব্ধ নয়' }}</p>
                    <p class="text-sm text-gray-600 mt-1">সকাল ৯টা - রাত ১০টা</p>
                </div>
            </div>
            <div class="border-t border-gray-100 pt-6 text-center text-sm text-gray-400">
                <p>&copy; {{ date('Y') }} {{ $storeName }}. সর্বস্বত্ব সংরক্ষিত।</p>
            </div>
        </div>
    </footer>
</body>
</html>
