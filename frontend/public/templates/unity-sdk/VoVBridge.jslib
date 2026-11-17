mergeInto(LibraryManager.library, {
  // 1. Tự đăng ký tên GameObject thật trong Scene Unity để Web tự động gửi lệnh đúng đối tượng
  RegisterUnityBridgeObject: function (objectNamePtr) {
    var objectName = UTF8ToString(objectNamePtr);
    try {
      if (typeof window !== "undefined" && window.VoVSDK && typeof window.VoVSDK.registerUnityTarget === "function") {
        window.VoVSDK.registerUnityTarget(objectName);
      }
    } catch (e) {}
  },

  // 2. Lấy số lượt chơi hiện có từ Web
  GetWebSpinCount: function () {
    if (typeof window !== "undefined" && window.VoVSDK && typeof window.VoVSDK.getState === "function") {
      return Number(window.VoVSDK.getState().spinTickets) || 0;
    }
    return 0;
  },

  // 3. Kiểm tra người chơi đã đăng nhập trên Web hay chưa (1 = đã đăng nhập, 0 = chưa)
  HasWebAuth: function () {
    if (typeof window !== "undefined" && window.VoVSDK && typeof window.VoVSDK.getState === "function") {
      return window.VoVSDK.getState().authToken ? 1 : 0;
    }
    return 0;
  },

  // 4. Báo cho Web biết người chơi vừa trúng / nhận Sản phẩm X để Web trừ 1 lượt & lưu vào Túi Đồ
  SendSpinRewardToWeb: function (itemIdPtr, itemNamePtr, quantity, rarityPtr) {
    var itemId = UTF8ToString(itemIdPtr);
    var itemName = UTF8ToString(itemNamePtr);
    var rarity = UTF8ToString(rarityPtr);

    try {
      if (typeof window !== "undefined" && typeof window.onUnitySpinReward === "function") {
        Promise.resolve(window.onUnitySpinReward(itemId, itemName, quantity, rarity)).catch(function (err) {
          console.warn("[VoVBridge] Lỗi đồng bộ phần thưởng về Web:", err);
        });
      } else if (typeof window !== "undefined" && window.VoVSDK && typeof window.VoVSDK.recordSpinReward === "function") {
        Promise.resolve(window.VoVSDK.recordSpinReward(itemId, itemName, quantity, rarity)).catch(function (err) {
          console.warn("[VoVBridge] Lỗi đồng bộ phần thưởng về Web:", err);
        });
      } else {
        console.warn("[VoVBridge] Không tìm thấy cầu nối window.onUnitySpinReward trên trang Web.");
      }
    } catch (e) {
      console.warn("[VoVBridge] Ngoại lệ khi gửi kết quả ra Web:", e);
    }
  },

  // 5. Yêu cầu Máy Chủ tự quay ngẫu nhiên theo tỉ lệ Probability và trả về OnServerSpinResult
  RollServerSpinOnWeb: function () {
    try {
      if (typeof window !== "undefined" && window.VoVSDK && typeof window.VoVSDK.rollServerSpin === "function") {
        Promise.resolve(window.VoVSDK.rollServerSpin()).catch(function (err) {
          console.warn("[VoVBridge] Lỗi RollServerSpinOnWeb:", err);
        });
      }
    } catch (e) {}
  },

  // 6. Nhận thưởng nhiệm vụ trực tiếp từ trong Unity (nếu game tự vẽ nút nhiệm vụ)
  ClaimMissionOnWeb: function (missionIdPtr) {
    var missionId = UTF8ToString(missionIdPtr);
    try {
      if (typeof window !== "undefined" && window.VoVSDK && typeof window.VoVSDK.claimMission === "function") {
        Promise.resolve(window.VoVSDK.claimMission(missionId)).catch(function (err) {
          console.warn("[VoVBridge] Lỗi ClaimMissionOnWeb:", err);
        });
      }
    } catch (e) {}
  },

  // 7. Yêu cầu Web đồng bộ lại trạng thái lượt chơi mới nhất từ máy chủ
  RequestWebSyncState: function () {
    try {
      if (typeof window !== "undefined" && window.VoVSDK && typeof window.VoVSDK.refreshPlayerState === "function") {
        Promise.resolve(window.VoVSDK.refreshPlayerState()).catch(function () {});
      }
    } catch (e) {}
  },

  // 8. Thông báo cho Web biết Scene Unity đã khởi tạo xong
  NotifyUnitySceneReady: function () {
    try {
      if (typeof window !== "undefined" && window.VoVSDK && typeof window.VoVSDK.notifyUnitySceneReady === "function") {
        window.VoVSDK.notifyUnitySceneReady();
      }
    } catch (e) {}
  }
});

