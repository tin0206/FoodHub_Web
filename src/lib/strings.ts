import type { Lang } from './i18n'

/**
 * Web port of the mobile app's `S` (lib/l10n/app_strings.dart) localization class.
 * Same keys/behavior — kept 1:1 so new mobile strings are easy to port over.
 */
export function getStrings(lang: Lang) {
  const vi = lang === 'vi'

  return {
    // ── Nav ────────────────────────────────────────────────────────────────
    navHome: vi ? 'Trang chủ' : 'Home',
    navSearch: vi ? 'Tìm kiếm' : 'Search',
    navRecs: vi ? 'Gợi ý' : 'Recs',
    navFavorites: vi ? 'Yêu thích' : 'Favorites',
    navProfile: vi ? 'Hồ sơ' : 'Profile',
    navAdmin: vi ? 'Quản trị' : 'Admin',

    // ── Shared ─────────────────────────────────────────────────────────────
    cancel: vi ? 'Hủy' : 'Cancel',
    delete: vi ? 'Xóa' : 'Delete',
    retry: vi ? 'Thử lại' : 'Retry',
    save: vi ? 'Lưu' : 'Save',

    // ── Greeting ───────────────────────────────────────────────────────────
    goodMorning: vi ? 'Chào buổi sáng 🌅' : 'Good morning 🌅',
    goodAfternoon: vi ? 'Chào buổi chiều ☀️' : 'Good afternoon ☀️',
    goodEvening: vi ? 'Chào buổi tối 🌙' : 'Good evening 🌙',

    // ── Home screen ────────────────────────────────────────────────────────
    myRecipes: vi ? 'Công thức của tôi' : 'My Recipes',
    recipeCount: (n: number) => (vi ? `${n} công thức` : `${n} recipe${n === 1 ? '' : 's'}`),
    noRecipesYet: vi ? 'Chưa có công thức nào' : 'No recipes yet',
    noRecipesDesc: vi
      ? 'Thêm công thức của bạn và chia sẻ sáng tạo ẩm thực'
      : 'Add your own recipes and share your culinary creations',
    addFirstRecipe: vi ? 'Thêm công thức đầu tiên' : 'Add your first recipe',
    unableToLoadRecipes: vi ? 'Không thể tải công thức.' : 'Unable to load recipes.',
    fillAllFields: vi ? 'Vui lòng điền đầy đủ thông tin.' : 'Please fill in all required fields.',
    unableToSaveRecipe: vi ? 'Không thể lưu công thức.' : 'Unable to save recipe.',

    // Add recipe panel
    newRecipeTitle: vi ? 'Công thức mới' : 'New Recipe',
    recipeNameHint: vi ? 'Tên công thức…' : 'Recipe name…',
    minSuffix: vi ? 'phút' : 'min',
    calSuffix: vi ? 'calo' : 'cal',
    ingredientsLabel: vi ? 'Nguyên liệu' : 'Ingredients',
    ingredientHint: (i: number) => (vi ? `Nguyên liệu ${i + 1}` : `Ingredient ${i + 1}`),
    addIngredient: vi ? 'Thêm nguyên liệu' : 'Add ingredient',
    instructionsLabel: vi ? 'Hướng dẫn' : 'Instructions',
    stepHint: (i: number) => (vi ? `Bước ${i + 1}...` : `Step ${i + 1}...`),
    addStep: vi ? 'Thêm bước' : 'Add step',
    labelsLabel: vi ? 'Nhãn' : 'Labels',
    saveRecipe: vi ? 'Lưu công thức' : 'Save Recipe',

    // ── Search screen ──────────────────────────────────────────────────────
    searchRecipesTitle: vi ? 'Tìm kiếm công thức' : 'Search Recipes',
    searchHint: vi ? 'Tìm công thức, nguyên liệu...' : 'Search recipes, ingredients...',
    popularCategories: vi ? 'Danh mục phổ biến' : 'Popular categories',
    recentRecipes: vi ? 'Công thức gần đây' : 'Recent recipes',
    resultCount: (n: number) => (vi ? `${n} kết quả` : `${n} result${n === 1 ? '' : 's'}`),
    unableToSearch: vi ? 'Không thể tìm kiếm công thức.' : 'Unable to search recipes.',

    // Search category display labels (values stay English for API filtering)
    categoryDisplay(value: string): string {
      if (!vi) return value;
      const map: Record<string, string> = {
        Breakfast: 'Bữa sáng',
        Lunch: 'Bữa trưa',
        Dinner: 'Bữa tối',
        'Quick Meals': 'Nấu nhanh',
        Alcoholic: 'Có cồn',
        Beverage: 'Đồ uống',
        'Dairy Free': 'Không sữa',
        'Gluten Free': 'Không gluten',
        'Nut Free': 'Không hạt',
        Pescetarian: 'Hải sản',
        Vegan: 'Thuần chay',
        Vegetarian: 'Ăn chay',
      };
      return map[value] ?? value;
    },

    // ── Favorites screen ───────────────────────────────────────────────────
    favoritesTitle: vi ? 'Yêu thích' : 'Favorites',
    savedRecipesWithNotes: vi ? 'Công thức đã lưu kèm ghi chú' : 'Saved recipes with your notes',
    savedLabel: vi ? 'Đã lưu' : 'Saved',
    withNotesLabel: vi ? 'Có ghi chú' : 'With Notes',
    noFavoritesYet: vi ? 'Chưa có yêu thích' : 'No favorites yet',
    removeFromFavorites: vi ? 'Xóa khỏi yêu thích?' : 'Remove from favorites?',
    removeConfirm: (name: string) =>
      vi ? `Bạn có muốn xóa "${name}" khỏi danh sách đã lưu?` : `Do you want to remove "${name}" from your saved recipes?`,
    unfavoriteLabel: vi ? 'Bỏ yêu thích' : 'Unfavorite',
    myNote: vi ? 'Ghi chú của tôi' : 'My Note',
    writeNoteHint: vi ? 'Viết ghi chú...' : 'Write your note...',
    saveNote: vi ? 'Lưu ghi chú' : 'Save Note',
    addNote: vi ? 'Thêm ghi chú' : 'Add Note',
    editNote: vi ? 'Sửa ghi chú' : 'Edit Note',
    unableToLoadFavorites: vi ? 'Không thể tải yêu thích.' : 'Unable to load favorites.',

    // ── AI Recs screen ─────────────────────────────────────────────────────
    aiCompanion: vi ? 'Trợ lý AI' : 'AI Companion',
    phaseLabel: (phase: string) => (vi ? `Giai đoạn: ${phase}` : `Phase: ${phase}`),
    startingSession: vi ? 'Đang khởi động phiên trợ lý...' : 'Starting companion session...',
    waitingForAi: vi ? 'Đang chờ phản hồi từ AI...' : 'Queued — waiting for AI...',
    resetChatTitle: vi ? 'Đặt lại cuộc trò chuyện?' : 'Reset chat?',
    resetChatDesc: vi
      ? 'Thao tác này sẽ xóa cuộc trò chuyện và các dữ liệu đã nhận diện. Tùy chọn hồ sơ vẫn được giữ nguyên.'
      : 'This clears the conversation and compose detections. Your profile preferences stay the same.',
    resetLabel: vi ? 'Đặt lại' : 'Reset',
    askForRecipesHint: vi ? 'Hỏi về công thức...' : 'Ask for recipes...',
    editDishesLabel: vi ? 'Sửa món ăn' : 'Edit dishes',
    editIngredientsLabel: vi ? 'Sửa nguyên liệu' : 'Edit ingredients',
    unableToOpenRecipe: (name: string) => (vi ? `Không thể mở chi tiết "${name}".` : `Could not open details for "${name}".`),
    unableToReachAi: vi
      ? 'Không thể kết nối với trợ lý AI. Vui lòng thử lại.'
      : 'Unable to reach AI assistant. Please try again.',

    // ── Recipe detail / cooking mode ───────────────────────────────────────
    addPhoto: vi ? 'Thêm ảnh' : 'Add Photo',
    recipeTitleHint: vi ? 'Tên món ăn...' : 'Recipe title...',
    changePhoto: vi ? 'Đổi ảnh' : 'Change Photo',

    startCooking: vi ? 'Bắt đầu nấu' : 'Start Cooking',
    prepareIngredients: vi ? 'Chuẩn bị nguyên liệu' : 'Prepare Ingredients',
    stepOf: (step: number, total: number) => (vi ? `Bước ${step} / ${total}` : `Step ${step} of ${total}`),
    stepLabel: (n: number) => (vi ? `Bước ${n}` : `Step ${n}`),
    ofTotal: (n: number) => (vi ? `/ ${n}` : `of ${n}`),
    getReady: vi ? 'Sẵn sàng thôi' : 'Get Ready',
    ingredientsToPrepare: (n: number) => (vi ? `${n} nguyên liệu cần chuẩn bị` : `${n} ingredient${n === 1 ? '' : 's'} to prepare`),
    estimatedTimePerStep: (m: number) => (vi ? `~${m} phút` : `~${m} min`),
    takeYourTimeWithStep: vi ? 'Hãy từ từ với bước này' : 'Take your time with this step',
    takeYourTime: vi ? 'Hãy từ từ — nhấn Tiếp khi sẵn sàng' : 'Take your time — tap Next when ready',
    back: vi ? 'Quay lại' : 'Back',
    next: vi ? 'Tiếp' : 'Next',
    finish: vi ? 'Hoàn thành! 🎉' : 'Finish! 🎉',
    edit: vi ? 'Chỉnh sửa' : 'Edit',
    saved: vi ? 'Đã lưu' : 'Saved',
    completed: vi ? 'Hoàn thành!' : 'Completed!',
    greatJobChef: vi ? 'Bạn nấu quá tuyệt! 👨‍🍳' : 'Great job chef 👨‍🍳',
    cookingMinutesDisplay: (m: number) => (vi ? `${m} phút` : `${m} min`),

    // ── Profile screen ─────────────────────────────────────────────────────
    yourProfile: vi ? 'Hồ sơ của bạn' : 'Your Profile',
    settingsPreferences: vi ? 'Cài đặt & tùy chọn' : 'Settings & preferences',
    appearance: vi ? 'Giao diện' : 'Appearance',
    themeLabel: vi ? 'Chủ đề' : 'Theme',
    darkMode: vi ? 'Chế độ tối' : 'Dark mode',
    lightMode: vi ? 'Chế độ sáng' : 'Light mode',
    languageLabel: vi ? 'Ngôn ngữ' : 'Language',
    langVietnamese: 'Tiếng Việt',
    langEnglish: 'English',
    personalInformation: vi ? 'Thông tin cá nhân' : 'Personal Information',
    updateProfileDetails: vi ? 'Cập nhật thông tin hồ sơ' : 'Update your profile details',
    fullNameLabel: vi ? 'Họ và tên' : 'Full Name',
    emailLabel: 'Email',
    ageLabel: vi ? 'Tuổi' : 'Age',
    weightLabel: vi ? 'Cân nặng (kg)' : 'Weight (kg)',
    nutritionGoals: vi ? 'Mục tiêu dinh dưỡng' : 'Nutrition Goals',
    setDietaryObjectives: vi ? 'Đặt mục tiêu dinh dưỡng' : 'Set your dietary objectives',
    primaryGoalLabel: vi ? 'Mục tiêu chính' : 'Primary Goal',
    dailyCalorieTarget: vi ? 'Mục tiêu calo hàng ngày' : 'Daily Calorie Target',
    targetProtein: vi ? 'Protein mục tiêu (g/ngày)' : 'Target Protein (g/day)',
    dietaryRestrictionsLabel: vi ? 'Chế độ ăn đặc biệt' : 'Dietary Restrictions',
    securityLabel: vi ? 'Bảo mật' : 'Security',
    changePasswordLabel: vi ? 'Đổi mật khẩu' : 'Change password',
    saveChanges: vi ? 'Lưu thay đổi' : 'Save changes',
    logOut: vi ? 'Đăng xuất' : 'Log out',
    mustBePositiveNumber: vi ? 'Phải là số dương' : 'Must be a positive number',
    unableToSaveProfile: vi ? 'Không thể lưu hồ sơ.' : 'Unable to save profile.',

    // Notifications section — not covered by mobile's S class yet, added for the web port.
    notifications: vi ? 'Thông báo' : 'Notifications',
    manageNotificationPrefs: vi ? 'Quản lý tùy chọn thông báo' : 'Manage your notification preferences',
    notifyRecipeRecommendations: vi ? 'Gợi ý công thức' : 'Recipe recommendations',
    notifyFeaturesUpdates: vi ? 'Tính năng & cập nhật mới' : 'New features & updates',
    notifyWeeklyNutritionSummary: vi ? 'Tổng kết dinh dưỡng hàng tuần' : 'Weekly nutrition summary',

    // Change password sheet
    changePasswordTitle: vi ? 'Đổi mật khẩu' : 'Change password',
    chooseStrongPassword: vi ? 'Chọn mật khẩu mạnh cho tài khoản của bạn' : 'Choose a strong password for your account',
    currentPassword: vi ? 'Mật khẩu hiện tại' : 'Current password',
    newPassword: vi ? 'Mật khẩu mới' : 'New password',
    confirmNewPassword: vi ? 'Xác nhận mật khẩu mới' : 'Confirm new password',
    enterCurrentPassword: vi ? 'Nhập mật khẩu hiện tại' : 'Enter your current password',
    mustBeAtLeast6: vi ? 'Phải ít nhất 6 ký tự' : 'Must be at least 6 characters',
    passwordsDoNotMatch: vi ? 'Mật khẩu không khớp' : 'Passwords do not match',
    updateLabel: vi ? 'Cập nhật' : 'Update',
    passwordUpdated: vi ? 'Đã cập nhật mật khẩu thành công.' : 'Password updated successfully.',
    unableToUpdatePassword: vi ? 'Không thể cập nhật mật khẩu.' : 'Unable to update password.',

    // Primary goals display
    goalDisplay(goal: string): string {
      if (!vi) return goal;
      const map: Record<string, string> = {
        'Balanced Nutrition': 'Dinh dưỡng cân bằng',
        'Weight Loss': 'Giảm cân',
        'Muscle Gain': 'Tăng cơ',
        'High Protein': 'Nhiều protein',
      };
      return map[goal] ?? goal;
    },

    // Label/tag display — covers recipe labels + dietary restriction tags
    dietaryTagDisplay(tag: string): string {
      if (!vi) return tag;
      const map: Record<string, string> = {
        // dietary restrictions
        Alcoholic: 'Có cồn',
        Beverage: 'Đồ uống',
        'Dairy Free': 'Không sữa',
        'Egg Free': 'Không trứng',
        'Gluten Free': 'Không gluten',
        'Nut Free': 'Không hạt',
        Pescetarian: 'Hải sản',
        Vegan: 'Thuần chay',
        Vegetarian: 'Ăn chay',
        // recipe labels
        Healthy: 'Lành mạnh',
        Italian: 'Ẩm thực Ý',
        'Comfort Food': 'Đồ ăn vặt',
        'High Protein': 'Nhiều protein',
        Keto: 'Keto',
        'Quick Meal': 'Nấu nhanh',
        'Meal Prep': 'Chuẩn bị sẵn',
        Breakfast: 'Bữa sáng',
      };
      return map[tag] ?? tag;
    },
  };
}

export type Strings = ReturnType<typeof getStrings>
