import type { Lang } from "./i18n";

/**
 * Web port of the mobile app's `S` (lib/l10n/app_strings.dart) localization class.
 * Same keys/behavior — kept 1:1 so new mobile strings are easy to port over.
 */
export function getStrings(lang: Lang) {
  const vi = lang === "vi";

  return {
    // ── Nav ────────────────────────────────────────────────────────────────
    navHome: vi ? "Trang chủ" : "Home",
    navSearch: vi ? "Tìm kiếm" : "Search",
    navRecs: vi ? "Gợi ý" : "Recs",
    navFavorites: vi ? "Yêu thích" : "Favorites",
    navProfile: vi ? "Hồ sơ" : "Profile",
    navAdmin: vi ? "Quản trị" : "Admin",

    // ── Shared ─────────────────────────────────────────────────────────────
    cancel: vi ? "Hủy" : "Cancel",
    delete: vi ? "Xóa" : "Delete",
    retry: vi ? "Thử lại" : "Retry",
    save: vi ? "Lưu" : "Save",

    // ── Greeting ───────────────────────────────────────────────────────────
    goodMorning: vi ? "Chào buổi sáng 🌅" : "Good morning 🌅",
    goodAfternoon: vi ? "Chào buổi chiều ☀️" : "Good afternoon ☀️",
    goodEvening: vi ? "Chào buổi tối 🌙" : "Good evening 🌙",

    // ── Home screen ────────────────────────────────────────────────────────
    myRecipes: vi ? "Công thức của tôi" : "My Recipes",
    recipeCount: (n: number) =>
      vi ? `${n} công thức` : `${n} recipe${n === 1 ? "" : "s"}`,
    noRecipesYet: vi ? "Chưa có công thức nào" : "No recipes yet",
    noRecipesDesc: vi
      ? "Thêm công thức của bạn và chia sẻ sáng tạo ẩm thực"
      : "Add your own recipes and share your culinary creations",
    addFirstRecipe: vi ? "Thêm công thức đầu tiên" : "Add your first recipe",
    unableToLoadRecipes: vi
      ? "Không thể tải công thức."
      : "Unable to load recipes.",
    personalRecipesTitle: vi ? "Công thức của tôi" : "Personal Recipes",
    topRecipesTitle: vi ? "Công thức nổi bật" : "Top Recipes",
    recommendedRecipesTitle: vi ? "Gợi ý cho bạn" : "Recommended for You",
    unableToLoadTopRecipes: vi
      ? "Không thể tải công thức nổi bật."
      : "Unable to load top recipes.",
    noTopRecipesYet: vi ? "Chưa có công thức nổi bật" : "No top recipes yet",
    recommendedComingSoon: vi
      ? "Gợi ý cá nhân hóa sẽ sớm ra mắt"
      : "Personalized recommendations are coming soon",
    breakfastLabel: vi ? "Bữa sáng" : "Breakfast",
    lunchLabel: vi ? "Bữa trưa" : "Lunch",
    dinnerLabel: vi ? "Bữa tối" : "Dinner",
    refreshSuggestions: vi ? "Làm mới gợi ý" : "Refresh suggestions",
    suggestionsPending: vi ? "Đang tạo gợi ý..." : "Generating suggestions…",
    suggestionsFailed: vi
      ? "Không thể tạo gợi ý."
      : "Unable to generate suggestions.",
    noSuggestionsForMeal: vi ? "Chưa có công thức" : "No recipes yet",
    aiHasOptionsIntro: (n: number) =>
      vi
        ? `Mình có ${n} cách để làm việc này — chọn cách phù hợp nhất nhé:`
        : `I've got ${n} idea${n === 1 ? "" : "s"} for you — pick what works best:`,

    // ── Meal plan / shopping list ─────────────────────────────────────────
    todaysMealPlan: vi ? "Kế hoạch bữa ăn hôm nay" : "Today's Meal Plan",
    addToPlanTitle: (title: string) =>
      vi ? `Thêm "${title}" vào...` : `Add "${title}" to...`,
    addToPlanLabel: vi ? "Thêm vào thực đơn" : "Add to plan",
    addedToPlanMessage: (slotLabel: string) =>
      vi ? `Đã thêm vào ${slotLabel}!` : `Added to ${slotLabel}!`,
    mealPlanPreview: (n: number) =>
      vi
        ? `${n} món đã lên kế hoạch`
        : `${n} dish${n === 1 ? "" : "es"} planned`,
    openMealPlan: vi ? "Xem kế hoạch" : "Open plan",
    unableToLoadMealPlan: vi
      ? "Không thể tải kế hoạch bữa ăn."
      : "Unable to load meal plan.",
    ingredientsDetail: vi ? "Chi tiết nguyên liệu" : "Ingredients Detail",
    addExtraMeal: vi ? "Thêm bữa phụ" : "Add extra meal",
    extraMealHint: vi ? "VD: Ăn vặt buổi chiều" : "e.g. Afternoon snack",
    addDish: vi ? "Thêm món" : "Add dish",
    emptyMealSlot: vi ? "Chưa có món nào" : "No dishes yet",
    mealPlanHint: vi
      ? "Kế hoạch được lưu tự động khi bạn thêm hoặc xóa món."
      : "Your plan saves automatically as you add or remove dishes.",
    addFromSearch: vi ? "Tìm công thức" : "Search recipes",
    noSearchResultsShort: vi ? "Không tìm thấy" : "No results found",
    unableToLoadIngredientsDetail: vi
      ? "Không thể tải chi tiết nguyên liệu."
      : "Unable to load ingredients detail.",
    organizingIngredientsDetail: vi
      ? "Đang tổng hợp chi tiết nguyên liệu..."
      : "Organizing your ingredients detail…",
    emptyIngredientsDetail: vi
      ? "Chưa có nguyên liệu nào cho ngày này"
      : "No ingredients for this day yet",
    purchasedItems: vi ? "Đã mua" : "Purchased",
    ingredientsDetailAllDone: vi
      ? "Đã chuẩn bị đủ nguyên liệu! Chúc bạn nấu ăn ngon."
      : "All set — happy cooking!",
    plannedServings: (n: number) =>
      vi
        ? `Dùng cho ${n % 1 === 0 ? n.toFixed(0) : n} khẩu phần`
        : `For ${n % 1 === 0 ? n.toFixed(0) : n} serving${n === 1 ? "" : "s"}`,
    fillAllFields: vi
      ? "Vui lòng điền đầy đủ thông tin."
      : "Please fill in all required fields.",
    unableToSaveRecipe: vi
      ? "Không thể lưu công thức."
      : "Unable to save recipe.",

    // Add recipe panel
    newRecipeTitle: vi ? "Công thức mới" : "New Recipe",
    recipeNameHint: vi ? "Tên công thức…" : "Recipe name…",
    minSuffix: vi ? "phút" : "min",
    calSuffix: vi ? "calo" : "cal",
    servingsSuffix: vi ? "khẩu phần" : "servings",
    ingredientHintSearch: vi ? "Tìm nguyên liệu…" : "Search ingredient…",
    ingredientsLabel: vi ? "Nguyên liệu" : "Ingredients",
    ingredientHint: (i: number) =>
      vi ? `Nguyên liệu ${i + 1}` : `Ingredient ${i + 1}`,
    addIngredient: vi ? "Thêm nguyên liệu" : "Add ingredient",
    instructionsLabel: vi ? "Hướng dẫn" : "Instructions",
    stepHint: (i: number) => (vi ? `Bước ${i + 1}...` : `Step ${i + 1}...`),
    addStep: vi ? "Thêm bước" : "Add step",
    labelsLabel: vi ? "Nhãn" : "Labels",
    saveRecipe: vi ? "Lưu công thức" : "Save Recipe",
    // Recipe detail Save/Saved toggle (favorite a recipe) — distinct from saveRecipe above,
    // which is the submit button for creating/editing a recipe.
    saveLabel: vi ? "Lưu" : "Save",
    nutritionLabel: vi ? "Dinh dưỡng" : "Nutrition",
    perServingLabel: vi ? "Mỗi khẩu phần" : "Per serving",
    proteinShort: vi ? "Đạm" : "Protein",
    carbsShort: vi ? "Tinh bột" : "Carbs",
    fatShort: vi ? "Chất béo" : "Fat",
    moreNutrition: vi ? "Thêm" : "More",
    hideNutrition: vi ? "Ẩn" : "Less",

    // ── Search screen ──────────────────────────────────────────────────────
    searchRecipesTitle: vi ? "Tìm kiếm công thức" : "Search Recipes",
    searchHint: vi
      ? "Tìm công thức, nguyên liệu..."
      : "Search recipes, ingredients...",
    popularCategories: vi ? "Danh mục phổ biến" : "Popular categories",
    recentRecipes: vi ? "Công thức gần đây" : "Recent recipes",
    resultCount: (n: number) =>
      vi ? `${n} kết quả` : `${n} result${n === 1 ? "" : "s"}`,
    unableToSearch: vi
      ? "Không thể tìm kiếm công thức."
      : "Unable to search recipes.",

    // Search category display labels (values stay English for API filtering)
    categoryDisplay(value: string): string {
      if (!vi) return value;
      const map: Record<string, string> = {
        Breakfast: "Bữa sáng",
        Lunch: "Bữa trưa",
        Dinner: "Bữa tối",
        Alcoholic: "Có cồn",
        Beverage: "Đồ uống",
        "Dairy Free": "Không sữa",
        "Gluten Free": "Không gluten",
        "Nut Free": "Không hạt",
        Pescetarian: "Hải sản",
        Vegan: "Thuần chay",
        Vegetarian: "Ăn chay",
      };
      return map[value] ?? value;
    },

    // ── Favorites screen ───────────────────────────────────────────────────
    favoritesTitle: vi ? "Yêu thích" : "Favorites",
    savedRecipesWithNotes: vi
      ? "Công thức đã lưu kèm ghi chú"
      : "Saved recipes with your notes",
    savedLabel: vi ? "Đã lưu" : "Saved",
    withNotesLabel: vi ? "Có ghi chú" : "With Notes",
    noFavoritesYet: vi ? "Chưa có yêu thích" : "No favorites yet",
    removeFromFavorites: vi ? "Xóa khỏi yêu thích?" : "Remove from favorites?",
    removeConfirm: (name: string) =>
      vi
        ? `Bạn có muốn xóa "${name}" khỏi danh sách đã lưu?`
        : `Do you want to remove "${name}" from your saved recipes?`,
    unfavoriteLabel: vi ? "Bỏ yêu thích" : "Unfavorite",
    myNote: vi ? "Ghi chú của tôi" : "My Note",
    writeNoteHint: vi ? "Viết ghi chú..." : "Write your note...",
    saveNote: vi ? "Lưu ghi chú" : "Save Note",
    addNote: vi ? "Thêm ghi chú" : "Add Note",
    editNote: vi ? "Sửa ghi chú" : "Edit Note",
    unableToLoadFavorites: vi
      ? "Không thể tải yêu thích."
      : "Unable to load favorites.",

    // ── AI Recs screen ─────────────────────────────────────────────────────
    aiCompanion: vi ? "Trợ lý AI" : "AI Companion",
    phaseLabel: (phase: string) =>
      vi ? `Giai đoạn: ${phase}` : `Phase: ${phase}`,
    startingSession: vi
      ? "Đang khởi động phiên trợ lý..."
      : "Starting companion session...",
    waitingForAi: vi
      ? "Đang chờ phản hồi từ AI..."
      : "Queued — waiting for AI...",
    resetChatTitle: vi ? "Đặt lại cuộc trò chuyện?" : "Reset chat?",
    resetChatDesc: vi
      ? "Thao tác này sẽ xóa cuộc trò chuyện và các dữ liệu đã nhận diện. Tùy chọn hồ sơ vẫn được giữ nguyên."
      : "This clears the conversation and compose detections. Your profile preferences stay the same.",
    resetLabel: vi ? "Đặt lại" : "Reset",
    askForRecipesHint: vi ? "Hỏi về công thức..." : "Ask for recipes...",
    editDishesLabel: vi ? "Sửa món ăn" : "Edit dishes",
    editIngredientsLabel: vi ? "Sửa nguyên liệu" : "Edit ingredients",
    unableToOpenRecipe: (name: string) =>
      vi
        ? `Không thể mở chi tiết "${name}".`
        : `Could not open details for "${name}".`,
    unableToReachAi: vi
      ? "Không thể kết nối với trợ lý AI. Vui lòng thử lại."
      : "Unable to reach AI assistant. Please try again.",
    rerun: vi ? "Chạy lại" : "Rerun",
    aiWelcomeFallback: vi
      ? "Xin chào! Tôi là trợ lý ẩm thực của bạn. Hãy cho tôi biết bạn muốn nấu gì."
      : "Hello! I'm your culinary companion. Tell me what you'd like to cook.",
    emptyReply: vi ? "(Không có phản hồi)" : "(Empty reply)",

    // Dish photo / ingredients photo detection
    dishPhotoLabel: vi ? "Ảnh món ăn" : "Dish photo",
    ingredientsPhotoLabel: vi ? "Ảnh nguyên liệu" : "Ingredients photo",
    analyzingPhoto: vi ? "Đang phân tích ảnh…" : "Analyzing photo…",
    dishesDetectedPrefix: vi ? "Món ăn nhận diện được:" : "Dishes detected:",
    ingredientsDetectedPrefix: vi
      ? "Nguyên liệu nhận diện được:"
      : "Ingredients detected:",
    couldNotRecognizeDish: vi
      ? "Không nhận diện được món ăn trong ảnh đó."
      : "Could not recognize a dish in that photo.",
    noIngredientsDetected: vi
      ? "Không phát hiện nguyên liệu nào trong ảnh đó."
      : "No ingredients detected in that photo.",
    unableToAnalyzePhoto: vi
      ? "Không thể phân tích ảnh."
      : "Unable to analyze the photo.",
    dishRecognizedTitle: vi
      ? "Đã nhận diện món ăn — có đúng không?"
      : "Dish recognized — is this right?",
    ingredientsDetectedTitle: vi
      ? "Đã phát hiện nguyên liệu — có đúng không?"
      : "Ingredients detected — is this right?",
    detectionResultAlt: vi ? "Kết quả nhận diện" : "Detection result",
    editBeforeAddingHint: vi
      ? "Chỉnh sửa trước khi thêm vào tin nhắn…"
      : "Edit before adding to your message…",
    useThisLabel: vi ? "Dùng cái này" : "Use this",

    // ── Recipe preview (chat link) ────────────────────────────────────────
    close: vi ? "Đóng" : "Close",
    recipeLabel: vi ? "Công thức" : "Recipe",
    loadingRecipe: vi ? "Đang tải công thức…" : "Loading recipe…",
    failedToLoadRecipe: vi
      ? "Không thể tải công thức"
      : "Failed to load recipe",
    openRecipeDetailsLabel: vi
      ? "Xem chi tiết công thức"
      : "Open recipe details",
    tapToViewRecipe: vi ? "Nhấn để xem công thức" : "Tap to view recipe",
    recipeNotOpenableDemo: vi
      ? "Không thể mở công thức này trong bản demo."
      : "This recipe id is not openable in the demo.",

    // ── Recipe detail / cooking mode ───────────────────────────────────────
    addPhoto: vi ? "Thêm ảnh" : "Add Photo",
    recipeTitleHint: vi ? "Tên món ăn..." : "Recipe title...",
    changePhoto: vi ? "Đổi ảnh" : "Change Photo",

    startCooking: vi ? "Bắt đầu nấu" : "Start Cooking",
    prepareIngredients: vi ? "Chuẩn bị nguyên liệu" : "Prepare Ingredients",
    stepOf: (step: number, total: number) =>
      vi ? `Bước ${step} / ${total}` : `Step ${step} of ${total}`,
    stepLabel: (n: number) => (vi ? `Bước ${n}` : `Step ${n}`),
    ofTotal: (n: number) => (vi ? `/ ${n}` : `of ${n}`),
    getReady: vi ? "Sẵn sàng thôi" : "Get Ready",
    ingredientsToPrepare: (n: number) =>
      vi
        ? `${n} nguyên liệu cần chuẩn bị`
        : `${n} ingredient${n === 1 ? "" : "s"} to prepare`,
    estimatedTimePerStep: (m: number) => (vi ? `~${m} phút` : `~${m} min`),
    takeYourTimeWithStep: vi
      ? "Hãy từ từ với bước này"
      : "Take your time with this step",
    takeYourTime: vi
      ? "Hãy từ từ — nhấn Tiếp khi sẵn sàng"
      : "Take your time — tap Next when ready",
    back: vi ? "Quay lại" : "Back",
    next: vi ? "Tiếp" : "Next",
    finish: vi ? "Hoàn thành! 🎉" : "Finish! 🎉",
    edit: vi ? "Chỉnh sửa" : "Edit",
    saved: vi ? "Đã lưu" : "Saved",
    completed: vi ? "Hoàn thành!" : "Completed!",
    greatJobChef: vi ? "Bạn nấu quá tuyệt! 👨‍🍳" : "Great job chef 👨‍🍳",
    cookingMinutesDisplay: (m: number) => (vi ? `${m} phút` : `${m} min`),

    // ── Profile screen ─────────────────────────────────────────────────────
    yourProfile: vi ? "Hồ sơ của bạn" : "Your Profile",
    settingsPreferences: vi ? "Cài đặt & tùy chọn" : "Settings & preferences",
    appearance: vi ? "Giao diện" : "Appearance",
    themeLabel: vi ? "Chủ đề" : "Theme",
    darkMode: vi ? "Chế độ tối" : "Dark mode",
    lightMode: vi ? "Chế độ sáng" : "Light mode",
    languageLabel: vi ? "Ngôn ngữ" : "Language",
    langVietnamese: "Tiếng Việt",
    langEnglish: "English",
    personalInformation: vi ? "Thông tin cá nhân" : "Personal Information",
    updateProfileDetails: vi
      ? "Cập nhật thông tin hồ sơ"
      : "Update your profile details",
    fullNameLabel: vi ? "Họ và tên" : "Full Name",
    emailLabel: "Email",
    ageLabel: vi ? "Tuổi" : "Age",
    weightLabel: vi ? "Cân nặng (kg)" : "Weight (kg)",
    nutritionGoals: vi ? "Mục tiêu dinh dưỡng" : "Nutrition Goals",
    setDietaryObjectives: vi
      ? "Đặt mục tiêu dinh dưỡng"
      : "Set your dietary objectives",
    primaryGoalLabel: vi ? "Mục tiêu chính" : "Primary Goal",
    dailyCalorieTarget: vi ? "Mục tiêu calo hàng ngày" : "Daily Calorie Target",
    targetProtein: vi ? "Protein mục tiêu (g/ngày)" : "Target Protein (g/day)",
    targetCarb: vi ? "Tinh bột mục tiêu (g/ngày)" : "Target Carbs (g/day)",
    targetFat: vi ? "Chất béo mục tiêu (g/ngày)" : "Target Fat (g/day)",
    dailyCarbTarget: vi ? "Mục tiêu tinh bột hàng ngày" : "Daily Carb Target",
    dailyFatTarget: vi ? "Mục tiêu chất béo hàng ngày" : "Daily Fat Target",
    dietaryRestrictionsLabel: vi
      ? "Chế độ ăn đặc biệt"
      : "Dietary Restrictions",
    securityLabel: vi ? "Bảo mật" : "Security",
    changePasswordLabel: vi ? "Đổi mật khẩu" : "Change password",
    saveChanges: vi ? "Lưu thay đổi" : "Save changes",
    logOut: vi ? "Đăng xuất" : "Log out",
    mustBePositiveNumber: vi ? "Phải là số dương" : "Must be a positive number",
    unableToSaveProfile: vi
      ? "Không thể lưu hồ sơ."
      : "Unable to save profile.",

    // Notifications section — not covered by mobile's S class yet, added for the web port.
    notifications: vi ? "Thông báo" : "Notifications",
    manageNotificationPrefs: vi
      ? "Quản lý tùy chọn thông báo"
      : "Manage your notification preferences",
    notifyRecipeRecommendations: vi
      ? "Gợi ý công thức"
      : "Recipe recommendations",
    notifyFeaturesUpdates: vi
      ? "Tính năng & cập nhật mới"
      : "New features & updates",
    notifyWeeklyNutritionSummary: vi
      ? "Tổng kết dinh dưỡng hàng tuần"
      : "Weekly nutrition summary",

    // Change password sheet
    changePasswordTitle: vi ? "Đổi mật khẩu" : "Change password",
    chooseStrongPassword: vi
      ? "Chọn mật khẩu mạnh cho tài khoản của bạn"
      : "Choose a strong password for your account",
    currentPassword: vi ? "Mật khẩu hiện tại" : "Current password",
    newPassword: vi ? "Mật khẩu mới" : "New password",
    confirmNewPassword: vi ? "Xác nhận mật khẩu mới" : "Confirm new password",
    enterCurrentPassword: vi
      ? "Nhập mật khẩu hiện tại"
      : "Enter your current password",
    mustBeAtLeast6: vi
      ? "Phải ít nhất 6 ký tự"
      : "Must be at least 6 characters",
    pwReqLength: vi ? "Ít nhất 6 ký tự" : "At least 6 characters",
    pwReqLetter: vi ? "Có chứa chữ cái" : "Contains a letter",
    pwReqNumber: vi ? "Có chứa chữ số" : "Contains a number",
    setPasswordLabel: vi ? "Đặt mật khẩu" : "Set password",
    setPasswordSubtitle: vi
      ? "Tài khoản đăng nhập bằng Google — đặt mật khẩu để có thể đăng nhập bằng email."
      : "Signed in with Google — set a password so you can also sign in with email.",
    setPasswordSentMessage: vi
      ? "Đã gửi mã 6 số tới email của bạn. Nhập mã trên màn hình đặt mật khẩu."
      : "We sent a 6-digit code to your email. Enter it on the next screen.",
    resetPasswordTitle: vi ? "Đặt lại mật khẩu" : "Reset password",
    resetPasswordSub: vi
      ? "Nhập mã OTP trong email và mật khẩu mới."
      : "Enter the code from your email and a new password.",
    otpLabel: vi ? "Mã OTP" : "Reset code",
    otpPlaceholder: vi ? "000000" : "000000",
    otpRequired: vi ? "Nhập mã 6 số trong email." : "Enter the 6-digit code from your email.",
    resendCodeLabel: vi ? "Gửi lại mã" : "Resend code",
    newPasswordLabel: vi ? "Mật khẩu mới" : "New password",
    confirmNewPasswordLabel: vi
      ? "Xác nhận mật khẩu mới"
      : "Confirm new password",
    resetPasswordCta: vi ? "Đặt lại mật khẩu" : "Reset password",
    resetPasswordSuccess: vi
      ? "Đặt lại mật khẩu thành công."
      : "Password reset successfully.",
    resetPasswordInvalidLink: vi
      ? "Thiếu email để đặt lại mật khẩu. Hãy yêu cầu mã mới."
      : "Missing email for password reset. Request a new code.",
    requestNewLinkLabel: vi ? "Gửi mã mới" : "Request a new code",
    passwordsDoNotMatch: vi ? "Mật khẩu không khớp" : "Passwords do not match",
    updateLabel: vi ? "Cập nhật" : "Update",
    passwordUpdated: vi
      ? "Đã cập nhật mật khẩu thành công."
      : "Password updated successfully.",
    unableToUpdatePassword: vi
      ? "Không thể cập nhật mật khẩu."
      : "Unable to update password.",

    // Primary goals display
    goalDisplay(goal: string): string {
      if (!vi) return goal;
      const map: Record<string, string> = {
        "Balanced Nutrition": "Dinh dưỡng cân bằng",
        "Weight Loss": "Giảm cân",
        "Muscle Gain": "Tăng cơ",
        "High Protein": "Nhiều protein",
      };
      return map[goal] ?? goal;
    },

    // Label/tag display — covers recipe labels + dietary restriction tags
    dietaryTagDisplay(tag: string): string {
      if (!vi) return tag;
      const map: Record<string, string> = {
        // dietary restrictions
        Alcoholic: "Có cồn",
        Beverage: "Đồ uống",
        "Dairy Free": "Không sữa",
        "Non-Alcoholic": "Không cồn",
        "Gluten Free": "Không gluten",
        "Nut Free": "Không hạt",
        Pescetarian: "Hải sản",
        Vegan: "Thuần chay",
        Vegetarian: "Ăn chay",
        // recipe labels
        Healthy: "Lành mạnh",
        Italian: "Ẩm thực Ý",
        "Comfort Food": "Đồ ăn vặt",
        "High Protein": "Nhiều protein",
        Keto: "Keto",
        "Quick Meal": "Nấu nhanh",
        "Meal Prep": "Chuẩn bị sẵn",
        Breakfast: "Bữa sáng",
        Lunch: "Bữa trưa",
        Dinner: "Bữa tối",
      };
      return map[tag] ?? tag;
    },

    // ── Admin: shared ──────────────────────────────────────────────────────
    adminBrand: "FoodHub Admin",
    refresh: vi ? "Làm mới" : "Refresh",
    updating: vi ? "Đang cập nhật…" : "Updating…",
    saving: vi ? "Đang lưu…" : "Saving…",
    loading: vi ? "Đang tải…" : "Loading…",
    prev: vi ? "Trước" : "Prev",
    active: vi ? "Hoạt động" : "Active",
    inactive: vi ? "Ngừng hoạt động" : "Inactive",
    publicLabel: vi ? "Công khai" : "Public",
    privateLabel: vi ? "Riêng tư" : "Private",
    adminRoleLabel: vi ? "Quản trị" : "Admin",
    userRoleLabel: vi ? "Người dùng" : "User",

    // ── Admin: nav ─────────────────────────────────────────────────────────
    adminNavOverview: vi ? "Tổng quan" : "Overview",
    adminNavAnalytics: vi ? "Phân tích" : "Analytics",
    adminNavRecipes: vi ? "Công thức" : "Recipes",
    adminNavUsers: vi ? "Người dùng" : "Users",
    adminNavProfile: vi ? "Hồ sơ" : "Profile",
    adminBackToApp: vi ? "Về ứng dụng" : "Back to app",

    // ── Admin: overview ────────────────────────────────────────────────────
    adminNoTokenStats: vi
      ? "Không có token API. Đăng nhập bằng tài khoản admin thật (không phải Admin Bypass) để xem số liệu trực tiếp."
      : "No API token. Sign in with a real admin account (not Admin Bypass) to see live stats.",
    adminRoleRequiredStats: vi
      ? "Cần quyền admin để xem số liệu trực tiếp."
      : "Admin role required to view live stats.",
    adminFailedLoadStats: vi ? "Không thể tải số liệu" : "Failed to load stats",
    adminWelcomeBack: vi ? "Chào mừng trở lại," : "Welcome back,",
    adminFallbackName: vi ? "Quản trị viên" : "Admin",
    adminAdministrator: vi ? "Quản trị viên" : "Administrator",
    adminOverviewTitle: vi ? "Tổng quan" : "Overview",
    adminTotalRecipes: vi ? "Tổng công thức" : "Total recipes",
    adminTotalUsers: vi ? "Tổng người dùng" : "Total users",
    adminRecentActivity: vi ? "Hoạt động gần đây" : "Recent Activity",
    adminNoActivityYet: vi ? "Chưa có hoạt động nào." : "No activity yet.",
    adminNewUserJoined: (rel: string) =>
      vi ? `Người dùng mới tham gia ${rel}` : `New user joined ${rel}`,
    adminRecipeAdded: (rel: string, visibility: string) =>
      vi
        ? `Công thức mới được thêm ${rel} · ${visibility}`
        : `Recipe added ${rel} · ${visibility}`,

    // ── Admin: analytics ───────────────────────────────────────────────────
    adminNoTokenAnalytics: vi
      ? "Không có token API. Đăng nhập bằng tài khoản admin thật (không phải Admin Bypass) để xem số liệu trực tiếp."
      : "No API token. Sign in with a real admin account (not Admin Bypass) to see live stats.",
    adminRoleRequiredAnalytics: vi
      ? "Cần quyền admin để xem phân tích."
      : "Admin role required to view analytics.",
    adminFailedLoadAnalytics: vi
      ? "Không thể tải dữ liệu phân tích"
      : "Failed to load analytics",
    adminAnalyticsTitle: vi ? "Phân tích" : "Analytics",
    adminTopRecipesHeading: vi
      ? "Công thức được yêu thích nhất (30 ngày qua)"
      : "Most Favorited Recipes (Last 30 Days)",
    adminNoTopRecipes: vi
      ? "Chưa có công thức nào trong 30 ngày qua."
      : "No recipes in the last 30 days yet.",
    adminPopularLabelsHeading: vi
      ? "Nhãn ăn kiêng phổ biến"
      : "Popular Dietary Labels",
    adminNoFavoritesYet: vi
      ? "Chưa có lượt yêu thích nào."
      : "No favorites yet.",
    adminNewUsersHeading: vi
      ? "Người dùng mới — 7 ngày qua"
      : "New Users — Last 7 Days",

    // ── Admin: recipes list ────────────────────────────────────────────────
    adminNoTokenRecipes: vi
      ? "Không có token API. Đăng nhập bằng tài khoản admin thật (không phải Admin Bypass) để quản lý công thức."
      : "No API token. Sign in with a real admin account (not Admin Bypass) to manage recipes.",
    adminRoleRequiredRecipesList: vi
      ? "Cần quyền admin để xem danh sách công thức."
      : "Admin role required to list recipes.",
    adminFailedLoadRecipes: vi
      ? "Không thể tải công thức"
      : "Failed to load recipes",
    adminRecipesTitle: vi ? "Công thức" : "Recipes",
    adminNewRecipe: vi ? "Công thức mới" : "New Recipe",

    // ── Aisle mapping job (admin recipes) ──────────────────────────────────
    adminMapAislesTitle: vi ? "Gán khu hàng" : "Map aisles",
    adminMappedStat: (mapped: number, total: number) =>
      vi
        ? `${mapped} / ${total} công thức đã gán`
        : `${mapped} / ${total} recipes mapped`,
    adminMissingStat: (n: number) =>
      vi
        ? `${n} công thức chưa có khu hàng`
        : `${n} recipe${n === 1 ? "" : "s"} missing aisle`,
    adminProcessedStat: (processed: number, total: number) =>
      vi
        ? `${processed} / ${total} đã xử lý`
        : `${processed} / ${total} processed`,
    adminMapAislesButton: vi ? "Gán khu hàng" : "Map aisles",
    adminRemapAislesButton: vi ? "Gán lại toàn bộ" : "Remap aisles",
    adminMappingAislesButton: vi ? "Đang gán khu hàng…" : "Mapping aisles…",
    adminStopButton: vi ? "Dừng" : "Stop",
    adminRemapConfirmTitle: vi
      ? "Gán lại toàn bộ khu hàng?"
      : "Remap all aisles?",
    adminRemapConfirmMessage: vi
      ? "Tất cả công thức đã có khu hàng sẽ được AI gán lại từ đầu. Việc này tốn nhiều token AI hơn."
      : "Every recipe that already has an aisle will be re-mapped by the AI from scratch. This uses more AI tokens than mapping only what's missing.",
    adminRemapConfirmButton: vi ? "Gán lại" : "Remap",
    adminAisleMappingStoppedToast: vi
      ? "Đã dừng gán khu hàng."
      : "Aisle mapping stopped.",
    adminAisleMappingFinishedToast: vi
      ? "Đã gán khu hàng xong."
      : "Aisle mapping finished.",
    adminUnableToLoadAisleStatus: vi
      ? "Không thể tải trạng thái gán khu hàng."
      : "Unable to load aisle mapping status.",
    adminUnableToStartAisleMapping: vi
      ? "Không thể bắt đầu gán khu hàng."
      : "Unable to start aisle mapping.",
    adminUnableToStopAisleMapping: vi
      ? "Không thể dừng gán khu hàng."
      : "Unable to stop aisle mapping.",
    adminSearchRecipesHint: vi
      ? "Tìm theo tên, id, nguyên liệu…"
      : "Search by title, id, ingredients…",
    filterAll: vi ? "Tất cả" : "All",
    filterPublic: vi ? "Công khai" : "Public",
    filterPrivate: vi ? "Riêng tư" : "Private",
    adminNoRecipesFound: vi
      ? "Không tìm thấy công thức nào"
      : "No recipes found",
    adminTryAnotherSearch: vi
      ? "Thử từ khóa khác hoặc xóa tìm kiếm."
      : "Try another search term or clear the search.",
    adminTryAnotherVisibilityFilter: vi
      ? "Thử bộ lọc hiển thị khác hoặc nạp dữ liệu vào API."
      : "Try another visibility filter or seed the API database.",
    adminShowingRecipes: (
      start: number,
      end: number,
      hasNext: boolean,
      query: string,
    ) =>
      vi
        ? `Hiện ${start}–${end} trong ${end}${hasNext ? "+" : ""} công thức${query ? ` · "${query}"` : ""}`
        : `Showing ${start}–${end} of ${end}${hasNext ? "+" : ""} recipes${query ? ` · "${query}"` : ""}`,

    // ── Admin: recipe detail ───────────────────────────────────────────────
    adminNoTokenGeneric: vi
      ? "Không có token API. Đăng nhập bằng tài khoản admin thật (không phải Admin Bypass)."
      : "No API token. Sign in with a real admin account (not Admin Bypass).",
    adminTranslationsUnavailable: vi
      ? "Không thể xem bản dịch (cần quyền admin)."
      : "Translations unavailable (admin required).",
    adminTranslationsLoadFailed: (msg: string) =>
      vi
        ? `Không thể tải bản dịch: ${msg}`
        : `Translations could not be loaded: ${msg}`,
    adminRecipeNotFound: vi ? "Không tìm thấy công thức." : "Recipe not found.",
    adminFailedLoadRecipe: vi
      ? "Không thể tải công thức"
      : "Failed to load recipe",
    adminLoadingRecipe: vi ? "Đang tải công thức…" : "Loading recipe…",
    adminBackToRecipes: vi ? "Về danh sách công thức" : "Back to recipes",
    adminMakePrivate: vi ? "Chuyển sang riêng tư" : "Make private",
    adminMakePublic: vi ? "Chuyển sang công khai" : "Make public",
    adminVisibilitySet: (visibility: string) =>
      vi
        ? `Đã đặt hiển thị thành ${visibility}.`
        : `Visibility set to ${visibility}.`,
    adminFailedUpdateVisibility: vi
      ? "Không thể cập nhật hiển thị"
      : "Failed to update visibility",
    adminCatalogNotice: vi
      ? "Công thức chung (chia sẻ). Chỉnh sửa sẽ tạo một bản sao riêng tư. API không cho phép xóa."
      : "Catalog recipe (shared). Edit creates a private copy. Delete is not allowed by the API.",
    adminIngredientsHeading: vi ? "Nguyên liệu" : "Ingredients",
    adminNoIngredients: vi ? "Không có nguyên liệu" : "No ingredients",
    adminInstructionsHeading: vi ? "Hướng dẫn" : "Instructions",
    adminNoDirections: vi ? "Không có hướng dẫn" : "No directions",
    adminNoDietaryLabels: vi ? "Không có nhãn ăn kiêng" : "No dietary labels",
    adminTranslationsHeading: vi ? "Bản dịch" : "Translations",
    adminNewLocaleSuffix: vi ? " · mới" : " · new",
    adminTitleLabel: vi ? "Tiêu đề" : "Title",
    adminIngredientsOnePerLine: vi
      ? "Nguyên liệu (mỗi dòng một mục)"
      : "Ingredients (one per line)",
    adminDirectionsOnePerLine: vi
      ? "Hướng dẫn (mỗi dòng một bước)"
      : "Directions (one per line)",
    adminSaveLocale: (locale: string) =>
      vi ? `Lưu ${locale}` : `Save ${locale}`,
    adminDeleteLocale: (locale: string) =>
      vi ? `Xóa ${locale}` : `Delete ${locale}`,
    adminTranslationTitleRequired: vi
      ? "Tiêu đề bản dịch là bắt buộc."
      : "Translation title is required.",
    adminTranslationSaved: (locale: string) =>
      vi ? `Đã lưu bản dịch ${locale}.` : `Saved ${locale} translation.`,
    adminFailedSaveTranslation: vi
      ? "Không thể lưu bản dịch"
      : "Failed to save translation",
    adminTranslationDeleted: (locale: string) =>
      vi ? `Đã xóa bản dịch ${locale}.` : `Deleted ${locale} translation.`,
    adminFailedDeleteTranslation: vi
      ? "Không thể xóa bản dịch"
      : "Failed to delete translation",
    adminFailedDeleteRecipe: vi
      ? "Không thể xóa công thức"
      : "Failed to delete recipe",
    adminDeleteTranslationTitle: vi ? "Xóa bản dịch?" : "Delete translation?",
    adminDeleteTranslationMessage: (locale: string, title: string) =>
      vi
        ? `Xóa bản dịch "${locale}" của "${title}"?`
        : `Remove the "${locale}" translation for "${title}"?`,
    adminDeleteRecipeTitle: vi ? "Xóa công thức?" : "Delete recipe?",
    adminDeleteRecipeMessage: (title: string) =>
      vi
        ? `"${title}" sẽ bị xóa vĩnh viễn.`
        : `"${title}" will be permanently deleted.`,
    adminLocaleLabel: vi ? "ngôn ngữ" : "locale",

    // ── Admin: recipe edit page ────────────────────────────────────────────
    adminSignInEditRecipes: vi
      ? "Đăng nhập bằng tài khoản admin thật để chỉnh sửa công thức."
      : "Sign in with a real admin account to edit recipes.",

    // ── Admin: recipe form ─────────────────────────────────────────────────
    adminCatalogFormNotice: vi
      ? "Đây là công thức chung (dùng chung). Lưu lại sẽ tạo một "
      : "This is a shared catalog recipe. Saving will create a ",
    adminCatalogFormNoticeStrong: vi ? "bản sao riêng tư" : "private copy",
    adminCatalogFormNoticeSuffix: vi
      ? " thuộc về bạn (theo API) — công thức gốc trong catalog không bị ghi đè."
      : " owned by you (API behavior) — the original catalog entry is not overwritten.",
    adminPhotoLabel: vi ? "Ảnh công thức" : "Recipe photo",
    adminPhotoUploadFailed: vi
      ? "Đã lưu công thức, nhưng không thể tải ảnh lên."
      : "Recipe saved, but the photo could not be uploaded.",
    adminRecipeNameHint: vi ? "Tên công thức…" : "Recipe name…",
    adminServingsOptional: vi ? "khẩu phần (tùy chọn)" : "servings (optional)",
    adminMinutesOptional: vi ? "phút (tùy chọn)" : "min (optional)",
    adminServingsCount: (n: number) =>
      vi ? `${n} khẩu phần` : `${n} serving${n === 1 ? "" : "s"}`,
    adminMinutesCount: (n: number) => (vi ? `${n} phút` : `${n} min`),
    adminCaloriesCount: (n: number) => (vi ? `${n} calo` : `${n} cal`),
    adminIngredientHint: (i: number) =>
      vi ? `Nguyên liệu ${i + 1}` : `Ingredient ${i + 1}`,
    adminAddIngredient: vi ? "Thêm nguyên liệu" : "Add ingredient",
    adminStepHint: (i: number) => (vi ? `Bước ${i + 1}…` : `Step ${i + 1}…`),
    adminAddStep: vi ? "Thêm bước" : "Add step",
    adminDietaryLabelsHeading: vi ? "Nhãn ăn kiêng" : "Dietary labels",
    adminRecipeFieldsRequired: vi
      ? "Tiêu đề, nguyên liệu và hướng dẫn là bắt buộc."
      : "Title, ingredients, and instructions are required.",
    adminServingsMustBePositive: vi
      ? "Khẩu phần phải là số dương."
      : "Servings must be a positive number.",
    adminMinutesMustBePositive: vi
      ? "Thời gian nấu phải là số dương."
      : "Cooking time must be a positive number.",
    adminFailedSaveRecipe: vi
      ? "Không thể lưu công thức"
      : "Failed to save recipe",
    adminSaveAsPrivateCopy: vi
      ? "Lưu thành bản sao riêng tư"
      : "Save as private copy",
    adminSaveRecipeChanges: vi ? "Lưu thay đổi" : "Save Changes",
    adminSaveRecipeCta: vi ? "Lưu công thức" : "Save Recipe",

    // ── Admin: users list ──────────────────────────────────────────────────
    adminNoTokenUsers: vi
      ? "Không có token API. Đăng nhập bằng tài khoản admin thật (không phải Admin Bypass) để quản lý người dùng."
      : "No API token. Sign in with a real admin account (not Admin Bypass) to manage users.",
    adminRoleRequiredUsersList: vi
      ? "Cần quyền admin để xem danh sách người dùng."
      : "Admin role required to list users.",
    adminFailedLoadUsers: vi
      ? "Không thể tải người dùng"
      : "Failed to load users",
    adminUsersTitle: vi ? "Người dùng" : "Users",
    adminAddUser: vi ? "Thêm người dùng" : "Add User",
    adminSearchUsersHint: vi
      ? "Tìm theo tên, email, tên đăng nhập…"
      : "Search by name, email, username…",
    filterAdmin: vi ? "Quản trị" : "Admin",
    filterActive: vi ? "Hoạt động" : "Active",
    filterInactive: vi ? "Ngừng hoạt động" : "Inactive",
    adminNoUsersFound: vi ? "Không tìm thấy người dùng nào" : "No users found",
    adminTryAnotherFilter: vi ? "Thử bộ lọc khác." : "Try another filter.",
    adminShowingUsers: (
      start: number,
      end: number,
      hasNext: boolean,
      query: string,
    ) =>
      vi
        ? `Hiện ${start}–${end} trong ${end}${hasNext ? "+" : ""} người dùng${query ? ` · "${query}"` : ""}`
        : `Showing ${start}–${end} of ${end}${hasNext ? "+" : ""} users${query ? ` · "${query}"` : ""}`,

    // ── Admin: user detail ─────────────────────────────────────────────────
    adminUserNotFound: vi ? "Không tìm thấy người dùng." : "User not found.",
    adminFailedLoadUser: vi
      ? "Không thể tải người dùng"
      : "Failed to load user",
    adminFailedUpdateUser: vi
      ? "Không thể cập nhật người dùng"
      : "Failed to update user",
    adminLoadingUser: vi ? "Đang tải người dùng…" : "Loading user…",
    adminBackToUsers: vi ? "Về danh sách người dùng" : "Back to users",
    adminProfileTab: vi ? "Hồ sơ" : "Profile",
    adminSavedTab: (n: number) => (vi ? `Đã lưu (${n})` : `Saved (${n})`),
    adminRecipesTab: (n: number) =>
      vi ? `Công thức (${n})` : `Recipes (${n})`,
    adminRecipesCountStat: (n: number) =>
      vi ? `${n} công thức` : `${n} recipe${n === 1 ? "" : "s"}`,
    adminSavedCountStat: (n: number) => (vi ? `${n} đã lưu` : `${n} saved`),
    adminAccountCardTitle: vi ? "Tài khoản" : "Account",
    adminNutritionGoalsCardTitle: vi
      ? "Mục tiêu dinh dưỡng"
      : "Nutrition Goals",
    adminDietaryRestrictionsCardTitle: vi
      ? "Chế độ ăn đặc biệt"
      : "Dietary Restrictions",
    adminUserIdLabel: vi ? "ID người dùng" : "User ID",
    adminUsernameLabel: vi ? "Tên đăng nhập" : "Username",
    adminJoinedLabel: vi ? "Ngày tham gia" : "Joined",
    adminAgeYears: (age: number) => (vi ? `${age} tuổi` : `${age} years`),
    adminWeightKg: (w: number) => `${w} kg`,
    adminCalorieDay: (c: number) => (vi ? `${c} calo/ngày` : `${c} cal/day`),
    adminCarbDay: (c: number) =>
      vi ? `${c} g tinh bột/ngày` : `${c} g carbs/day`,
    adminFatDay: (c: number) =>
      vi ? `${c} g chất béo/ngày` : `${c} g fat/day`,
    adminNoneSpecified: vi ? "Chưa xác định" : "None specified",
    adminDeactivateAccount: vi ? "Vô hiệu hóa tài khoản" : "Deactivate Account",
    adminActivateAccount: vi ? "Kích hoạt tài khoản" : "Activate Account",
    adminNoSavedRecipesYet: vi
      ? "Chưa có công thức đã lưu"
      : "No saved recipes yet",
    adminNoCreatedRecipesYet: vi
      ? "Chưa có công thức nào được tạo"
      : "No recipes created yet",
    adminDeactivateAccountTitle: vi
      ? "Vô hiệu hóa tài khoản?"
      : "Deactivate Account?",
    adminActivateAccountTitle: vi
      ? "Kích hoạt tài khoản?"
      : "Activate Account?",
    adminWillLoseAccess: (name: string) =>
      vi
        ? `${name} sẽ mất quyền truy cập ứng dụng.`
        : `${name} will lose access to the app.`,
    adminWillRegainAccess: (name: string) =>
      vi
        ? `${name} sẽ được cấp lại quyền truy cập ứng dụng.`
        : `${name} will regain access to the app.`,
    deactivateLabel: vi ? "Vô hiệu hóa" : "Deactivate",
    activateLabel: vi ? "Kích hoạt" : "Activate",

    // ── Admin: user edit page ──────────────────────────────────────────────
    adminSignInEditUsers: vi
      ? "Đăng nhập bằng tài khoản admin thật để chỉnh sửa người dùng."
      : "Sign in with a real admin account to edit users.",

    // ── Admin: user form ───────────────────────────────────────────────────
    adminFullNameFieldLabel: vi ? "Họ và tên" : "Full name",
    adminUsernameFieldLabel: vi ? "Tên đăng nhập" : "Username",
    adminEmailFieldLabel: "Email",
    adminPasswordFieldLabel: vi ? "Mật khẩu" : "Password",
    adminRoleFieldLabel: vi ? "Vai trò" : "Role",
    adminStatusFieldLabel: vi ? "Trạng thái" : "Status",
    adminAgeFieldLabel: vi ? "Tuổi" : "Age",
    adminWeightFieldLabel: vi ? "Cân nặng (kg)" : "Weight (kg)",
    adminCalorieTargetFieldLabel: vi
      ? "Mục tiêu calo (calo/ngày)"
      : "Calorie target (cal/day)",
    adminProteinTargetFieldLabel: vi
      ? "Mục tiêu protein (g/ngày)"
      : "Protein target (g/day)",
    adminPrimaryGoalFieldLabel: vi ? "Mục tiêu chính" : "Primary goal",
    adminDietaryRestrictionsFieldLabel: vi
      ? "Chế độ ăn đặc biệt"
      : "Dietary restrictions",
    adminPasswordHint: vi ? "Ít nhất 6 ký tự" : "At least 6 characters",
    adminPrimaryGoalHint: vi ? "vd. Tăng cơ" : "e.g. Build Muscle",
    adminPasswordRequired: vi
      ? "Vui lòng nhập mật khẩu."
      : "Please enter a password.",
    adminPasswordTooShort: vi
      ? "Mật khẩu phải có ít nhất 6 ký tự."
      : "Password must be at least 6 characters.",
    adminUsernameEmailRequired: vi
      ? "Vui lòng điền tên đăng nhập và email."
      : "Please fill in username and email.",
    adminFailedSaveUser: vi
      ? "Không thể lưu người dùng"
      : "Failed to save user",
    adminUserCreatedSuccess: (username: string) =>
      vi
        ? `Đã tạo người dùng "${username}" thành công.`
        : `User "${username}" created successfully.`,
    adminSaveUserChanges: vi ? "Lưu thay đổi" : "Save Changes",
    adminAddUserCta: vi ? "Thêm người dùng" : "Add User",

    // ── Onboarding survey (post sign-up) ────────────────────────────────────
    onboardingWelcomeTitle: vi ? "Chào mừng đến với FoodHub!" : "Welcome to FoodHub!",
    onboardingWelcomeSubtitle: vi
      ? "Cho chúng tôi biết một chút về bạn để cá nhân hóa gợi ý món ăn."
      : "Tell us a bit about yourself so we can personalize your recommendations.",
    onboardingStepOf: (step: number, total: number) =>
      vi ? `Bước ${step}/${total}` : `Step ${step} of ${total}`,
    onboardingStepAboutTitle: vi ? "Về bạn" : "About you",
    onboardingStepAboutSubtitle: vi
      ? "Thông tin này giúp chúng tôi ước tính khẩu phần phù hợp."
      : "This helps us tailor portion and nutrition suggestions.",
    onboardingStepGoalTitle: vi ? "Mục tiêu của bạn" : "Your goal",
    onboardingStepGoalSubtitle: vi
      ? "Bạn muốn tập trung vào điều gì?"
      : "What would you like to focus on?",
    onboardingStepDietaryTitle: vi ? "Chế độ ăn" : "Dietary preferences",
    onboardingStepDietarySubtitle: vi
      ? "Chọn những chế độ phù hợp với bạn (có thể bỏ qua)."
      : "Pick any that apply to you (optional).",
    onboardingSkip: vi ? "Bỏ qua" : "Skip for now",
    onboardingBack: vi ? "Quay lại" : "Back",
    onboardingContinue: vi ? "Tiếp tục" : "Continue",
    onboardingFinish: vi ? "Hoàn tất" : "Finish",
    onboardingSaving: vi ? "Đang lưu…" : "Saving…",
    onboardingChangeLaterHint: vi
      ? "Bạn có thể thay đổi thông tin này bất cứ lúc nào trong Hồ sơ."
      : "You can change this anytime from your Profile.",

    // ── Recipe fork (edit a public recipe into a personal copy) ────────────
    editRecipeLabel: vi ? "Chỉnh sửa" : "Edit",
    newPersonalRecipeTitle: vi ? "Tạo công thức của bạn" : "Make it your own",
    forkRecipeNotice: vi
      ? "Chỉnh sửa sẽ tạo một bản sao mới trong Công thức của tôi — công thức gốc không bị thay đổi."
      : "Editing this will save a new copy to your Personal Recipes — the original stays unchanged.",
    saveAsNewRecipeLabel: vi ? "Lưu thành công thức mới" : "Save as new recipe",
    recipeSavedToast: vi ? "Đã lưu công thức!" : "Recipe saved!",
  };
}

export type Strings = ReturnType<typeof getStrings>;
