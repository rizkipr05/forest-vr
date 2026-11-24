import type { AchievementItem, QuizDefinition } from "@/types/amazon";

export const AMAZON_QUIZ: QuizDefinition = {
  id: "quiz-amazon-explorer-1",
  slug: "petualangan-amazon-dasar",
  title: "Tantangan Penjelajah Amazon",
  description:
    "Uji pengetahuanmu tentang satwa unik, tumbuhan raksasa, dan fakta seru ekosistem Hutan Amazon!",
  questions: [
    {
      id: "q1",
      type: "guess_image",
      prompt: "Tebak hewan apakah pada gambar di bawah ini yang suka berenang di sungai Amazon?",
      hint: "Hewan ini adalah kucing besar dengan pola bintik bunga mawar (roset)!",
      imageUrl: "/images/animals/jaguar.jpg",
      relatedSpeciesSlug: "jaguar",
      explanation:
        "Tepat sekali! Itu adalah Jaguar (Panthera onca), kucing besar terkuat di Amerika Selatan yang jago berenang.",
      options: [
        { id: "q1-a", label: "Jaguar", isCorrect: true },
        { id: "q1-b", label: "Kapibara", isCorrect: false },
        { id: "q1-c", label: "Tapir", isCorrect: false },
        { id: "q1-d", label: "Sloth", isCorrect: false },
      ],
    },
    {
      id: "q2",
      type: "multiple_choice",
      prompt: "Mengapa paruh Burung Tukan yang sangat besar tidak membuatnya kesulitan terbang?",
      hint: "Ingat struktur bagian dalam paruhnya!",
      relatedSpeciesSlug: "toucan",
      explanation:
        "Paruh Burung Tukan terbuat dari keratin dengan struktur berongga seperti spons sehingga sangat ringan!",
      options: [
        { id: "q2-a", label: "Karena berisi air sungai", isCorrect: false },
        { id: "q2-b", label: "Karena berongga dan sangat ringan", isCorrect: true },
        { id: "q2-c", label: "Karena terbuat dari batu alam", isCorrect: false },
        { id: "q2-d", label: "Karena Tukan tidak bisa terbang", isCorrect: false },
      ],
    },
    {
      id: "q3",
      type: "guess_image",
      prompt: "Siapakah hewan pengerat terbesar di dunia yang ramah dan senang bersantai di tepi air?",
      hint: "Lihat bentuk tubuhnya yang gempal dan kakinya yang pandai berenang.",
      imageUrl: "/images/animals/capybara.jpg",
      relatedSpeciesSlug: "capybara",
      explanation:
        "Benar! Itu adalah Kapibara, hewan pengerat terbesar di dunia yang terkenal sangat tenang dan bersahabat.",
      options: [
        { id: "q3-a", label: "Anakonda Hijau", isCorrect: false },
        { id: "q3-b", label: "Tapir", isCorrect: false },
        { id: "q3-c", label: "Kapibara", isCorrect: true },
        { id: "q3-d", label: "Katak Panah Beracun", isCorrect: false },
      ],
    },
    {
      id: "q4",
      type: "plant_id",
      prompt: "Tumbuhan air raksasa di Amazon manakah yang daunnya mampu menahan berat seorang anak kecil?",
      hint: "Daunnya berbentuk bundar seperti piring raksasa di permukaan sungai.",
      imageUrl: "/images/plants/amazon-water-lily.jpg",
      relatedSpeciesSlug: "amazon-water-lily",
      explanation:
        "Hebat! Teratai Raksasa Amazon (Victoria amazonica) memiliki rangka urat daun berongga yang sangat kuat mengapung.",
      options: [
        { id: "q4-a", label: "Bromelia Hutan", isCorrect: false },
        { id: "q4-b", label: "Teratai Raksasa Amazon", isCorrect: true },
        { id: "q4-c", label: "Pakis Raksasa Amazon", isCorrect: false },
        { id: "q4-d", label: "Helikonia", isCorrect: false },
      ],
    },
    {
      id: "q5",
      type: "amazon_fact",
      prompt: "Mengapa hewan di lantai hutan seperti Sloth sering memiliki warna kehijauan pada bulunya?",
      hint: "Ada tumbuhan mikroskopis yang menumpang hidup di bulu Sloth yang lembap.",
      relatedSpeciesSlug: "sloth",
      explanation:
        "Ganggang hijau tumbuh di bulu Sloth dan membantunya berkamuflase (menyamar) di antara dedaunan hijau!",
      options: [
        { id: "q5-a", label: "Karena ditumbuhi ganggang hijau sebagai kamuflase", isCorrect: true },
        { id: "q5-b", label: "Karena suka mengecat bulunya dengan daun", isCorrect: false },
        { id: "q5-c", label: "Karena bulunya memantulkan warna air laut", isCorrect: false },
        { id: "q5-d", label: "Karena makan terlalu banyak wortel", isCorrect: false },
      ],
    },
    {
      id: "q6",
      type: "plant_id",
      prompt: "Tanaman epifit manakah yang daunnya membentuk mangkuk untuk menampung air hujan bagi kecebong katak?",
      hint: "Kelopak tengahnya sering berwarna merah cerah dan menempel di batang kayu.",
      imageUrl: "/images/plants/bromeliad.jpg",
      relatedSpeciesSlug: "bromeliad",
      explanation:
        "Tepat! Bromelia Hutan menampung air hujan di tengah daunnya dan menjadi kolam mini bagi kecebong katak hutan.",
      options: [
        { id: "q6-a", label: "Pohon Kapuk Raksasa", isCorrect: false },
        { id: "q6-b", label: "Pakis Raksasa Amazon", isCorrect: false },
        { id: "q6-c", label: "Bromelia Hutan", isCorrect: true },
        { id: "q6-d", label: "Teratai Raksasa Amazon", isCorrect: false },
      ],
    },
    {
      id: "q7",
      type: "guess_image",
      prompt: "Burung berwarna merah, kuning, dan biru di gambar ini terkenal sangat cerdas. Siapakah dia?",
      hint: "Paruhnya kuat sekali untuk memecahkan kacang keras di kanopi hutan.",
      imageUrl: "/images/animals/macaw.jpg",
      relatedSpeciesSlug: "macaw",
      explanation:
        "Keren! Itu adalah Makaw Merah (Scarlet Macaw), burung nuri cerdas penjaga kanopi Hutan Amazon.",
      options: [
        { id: "q7-a", label: "Burung Tukan", isCorrect: false },
        { id: "q7-b", label: "Makaw Merah", isCorrect: true },
        { id: "q7-c", label: "Katak Panah Beracun", isCorrect: false },
        { id: "q7-d", label: "Tapir", isCorrect: false },
      ],
    },
    {
      id: "q8",
      type: "multiple_choice",
      prompt: "Hewan manakah yang dijuluki 'Tukang Kebun Hutan' karena rajin menyebarkan biji tanaman dengan belalai mungilnya?",
      hint: "Tubuhnya gempal dan punya hidung lentur seperti belalai mini!",
      relatedSpeciesSlug: "tapir",
      explanation:
        "Betul! Tapir Amerika Selatan membantu menumbuhkan hutan baru karena selalu menyebarkan biji buah sepanjang perjalanannya.",
      options: [
        { id: "q8-a", label: "Tapir Amerika Selatan", isCorrect: true },
        { id: "q8-b", label: "Anakonda Hijau", isCorrect: false },
        { id: "q8-c", label: "Burung Tukan", isCorrect: false },
        { id: "q8-d", label: "Katak Panah Beracun", isCorrect: false },
      ],
    },
    {
      id: "q9",
      type: "amazon_fact",
      prompt: "Apa fungsi warna biru-kuning yang sangat mencolok pada tubuh Katak Panah Beracun?",
      hint: "Katak ini tidak bersembunyi, justru memperingatkan predator!",
      imageUrl: "/images/animals/poison-dart-frog.jpg",
      relatedSpeciesSlug: "poison-dart-frog",
      explanation:
        "Warna cerah adalah sinyal peringatan alami (aposematisme) agar pemangsa tahu kulit katak ini berbahaya dimakan!",
      options: [
        { id: "q9-a", label: "Agar terlihat seperti batu sungai", isCorrect: false },
        { id: "q9-b", label: "Sebagai sinyal peringatan bahwa ia beracun", isCorrect: true },
        { id: "q9-c", label: "Untuk menyerap salju musim dingin", isCorrect: false },
        { id: "q9-d", label: "Agar bisa menyala seperti kunang-kunang di siang hari", isCorrect: false },
      ],
    },
    {
      id: "q10",
      type: "plant_id",
      prompt: "Bagaimana Pakis Raksasa Amazon berkembang biak karena tumbuhan purba ini tidak memiliki bunga?",
      hint: "Butiran halus di balik daunnya terbawa angin atau air lembap.",
      imageUrl: "/images/plants/giant-fern.jpg",
      relatedSpeciesSlug: "giant-fern",
      explanation:
        "Benar! Pakis adalah tumbuhan purba yang berkembang biak menggunakan spora, bukan biji atau bunga.",
      options: [
        { id: "q10-a", label: "Menggunakan spora", isCorrect: true },
        { id: "q10-b", label: "Menggunakan buah apel hutan", isCorrect: false },
        { id: "q10-c", label: "Menggunakan umbi kentang", isCorrect: false },
        { id: "q10-d", label: "Menggunakan bunga matahari", isCorrect: false },
      ],
    },
  ],
};

export const AMAZON_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: "ach-first-step",
    code: "FIRST_DISCOVERY",
    title: "Langkah Pertama Penjelajah",
    description: "Berhasil menemukan dan mempelajari 1 spesies pertama di Hutan Amazon 3D.",
    iconName: "Compass",
    badgeColor: "#10b981",
    requirementType: "discover_count",
    requirementValue: 1,
  },
  {
    id: "ach-wildlife-friend",
    code: "RAINFOREST_SCOUT",
    title: "Pramuka Rimba Amazon",
    description: "Menemukan minimal 5 satwa atau tumbuhan unik di lingkungan 3D.",
    iconName: "Binoculars",
    badgeColor: "#0ea5e9",
    requirementType: "discover_count",
    requirementValue: 5,
  },
  {
    id: "ach-master-naturalist",
    code: "AMAZON_GUARDIAN",
    title: "Penjaga Hutan Amazon",
    description: "Menjelajahi dan menemukan seluruh 13 spesies satwa serta tumbuhan Amazon!",
    iconName: "Crown",
    badgeColor: "#f59e0b",
    requirementType: "discover_all",
    requirementValue: 13,
  },
  {
    id: "ach-quiz-finisher",
    code: "QUIZ_CHALLENGER",
    title: "Penakluk Kuis Rimba",
    description: "Menyelesaikan Kuis Penjelajah Amazon hingga akhir.",
    iconName: "Award",
    badgeColor: "#8b5cf6",
    requirementType: "quiz_complete",
    requirementValue: 1,
  },
  {
    id: "ach-quiz-ace",
    code: "AMAZON_SCHOLAR",
    title: "Cendekiawan Muda Amazon",
    description: "Meraih skor 80% atau lebih tinggi pada Kuis Penjelajah Amazon!",
    iconName: "Sparkles",
    badgeColor: "#ec4899",
    requirementType: "quiz_score",
    requirementValue: 80,
  },
];
