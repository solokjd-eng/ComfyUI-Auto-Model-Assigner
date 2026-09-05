import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

// CSS 스타일시트 동적 로드
const link = document.createElement("link");
link.rel = "stylesheet";
link.type = "text/css";
link.href = new URL("./auto_assigner.css", import.meta.url).href;
document.head.appendChild(link);

const SKIP_VALUE = "__SKIP_APPLY__";

/**
 * ⚡ ComfyUI Auto Model & LoRA Assigner Engine
 */
class AutoModelAssigner {
    static modelsCache = null;

    /**
     * 로컬 모델 파일 목록 API 호출 및 캐싱
     */
    static async fetchLocalModels() {
        try {
            const resp = await api.fetchApi("/api/auto-assign/models");
            if (resp.ok) {
                const data = await resp.json();
                if (data.status === "success" && data.data) {
                    this.modelsCache = data.data;
                    return this.modelsCache;
                }
            }
        } catch (err) {
            console.warn("[AutoModelAssigner] Backend API not reachable, falling back to widget options:", err);
        }
        return null;
    }

    /**
     * 해당 노드가 모델/LoRA 관련 노드인지 확인
     */
    static isModelNode(node) {
        if (!node || !node.widgets) return false;
        return node.widgets.some(w => this.isModelWidget(w, node));
    }

    /**
     * 해당 위젯이 모델/LoRA 선택 위젯인지 판별
     */
    static isModelWidget(widget, node) {
        if (!widget || widget.type !== "combo") return false;
        const name = (widget.name || "").toLowerCase();
        
        // 이름 패턴 검사
        if (
            name.includes("ckpt") ||
            name.includes("unet") ||
            name.includes("clip") ||
            name.includes("vae") ||
            name.includes("lora") ||
            name.includes("control_net") ||
            name.includes("model_name") ||
            name.includes("upscale_model") ||
            name === "model"
        ) {
            return true;
        }

        // 위젯 options.values에 safetensors, ckpt 등이 포함되어 있는지 검사
        if (widget.options && Array.isArray(widget.options.values)) {
            const hasModelFiles = widget.options.values.some(v => 
                typeof v === "string" && (
                    v.endsWith(".safetensors") || 
                    v.endsWith(".ckpt") || 
                    v.endsWith(".pt") || 
                    v.endsWith(".bin") ||
                    v.endsWith(".pth")
                )
            );
            if (hasModelFiles) return true;
        }

        return false;
    }

    /**
     * 위젯 및 노드 유형으로부터 모델 카테고리 추론
     */
    static detectCategory(widget, node) {
        const wName = (widget.name || "").toLowerCase();
        const nType = (node.type || "").toLowerCase();

        if (wName.includes("ckpt") || nType.includes("checkpoint")) return "checkpoints";
        if (wName.includes("unet") || nType.includes("unet") || nType.includes("diffusion")) return "diffusion_models";
        if (wName.includes("lora") || nType.includes("lora")) return "loras";
        if (wName.includes("vae") || nType.includes("vae")) return "vae";
        if (wName.includes("clip") || nType.includes("clip") || nType.includes("text_encoder")) return "clip";
        if (wName.includes("control_net") || nType.includes("controlnet")) return "controlnet";
        if (wName.includes("upscale") || nType.includes("upscale")) return "upscale_models";
        return "checkpoints";
    }

    /**
     * 문자열 정규화 (비교용)
     */
    static normalizeString(str) {
        if (!str) return "";
        let clean = str.replace(/\\/g, "/").split("/").pop(); // 파일명만 추출
        clean = clean.replace(/\.(safetensors|ckpt|pt|bin|pth|onnx|engine)$/i, ""); // 확장자 제거
        clean = clean.toLowerCase();
        clean = clean.replace(/[_.\-\s()[\]]+/g, " ").trim(); // 특수문자 공백 치환
        return clean;
    }

    /**
     * 온라인 검색용 최적화 쿼리 추출
     * (특수문자, 확장자, 경로 등을 제거하여 구글/허깅페이스/Civitai에서 100% 검색되도록 정제)
     */
    static getCleanSearchQuery(filename) {
        if (!filename) return "";
        let base = filename.replace(/\\/g, "/").split("/").pop();
        base = base.replace(/\.(safetensors|ckpt|pt|bin|pth|onnx|engine)$/i, "");
        base = base.replace(/[_.\-\s()[\]]+/g, " ").trim();
        return base;
    }

    /**
     * 두 문자열 간의 유사도 점수 산출 (0 ~ 100)
     */
    static calculateSimilarity(target, candidate) {
        if (!target || !candidate) return 0;

        const targetBase = target.replace(/\\/g, "/").split("/").pop();
        const candBase = candidate.replace(/\\/g, "/").split("/").pop();

        // 1. 순수 파일명(확장자 포함) 완전 일치 (폴더 경로만 다른 경우)
        if (targetBase.toLowerCase() === candBase.toLowerCase()) {
            return 100;
        }

        const normTarget = this.normalizeString(target);
        const normCand = this.normalizeString(candidate);

        // 2. 정규화 후 완전 일치
        if (normTarget === normCand) {
            return 98;
        }

        // 3. 토큰 자카드 유사도 + 부분 포함 점수
        const targetTokens = new Set(normTarget.split(" ").filter(t => t.length > 0));
        const candTokens = new Set(normCand.split(" ").filter(t => t.length > 0));

        let intersection = 0;
        for (const t of targetTokens) {
            if (candTokens.has(t)) intersection++;
        }

        const union = new Set([...targetTokens, ...candTokens]).size;
        const jaccard = union === 0 ? 0 : (intersection / union);

        // 4. 레벤슈타인 거리 기반 유사도
        const levScore = this.levenshteinScore(normTarget, normCand);

        // 5. 가중치 점수 계산
        let finalScore = Math.round((jaccard * 0.6 + levScore * 0.4) * 100);

        // 정밀도 키워드 일치 보너스 (fp8, fp16, bf16)
        const precisions = ["fp8", "fp16", "bf16", "v1", "v2", "turbo", "inpainting", "lora"];
        for (const p of precisions) {
            if (normTarget.includes(p) && normCand.includes(p)) finalScore += 5;
            if (normTarget.includes(p) && !normCand.includes(p)) finalScore -= 5;
        }

        return Math.max(0, Math.min(99, finalScore));
    }

    /**
     * 레벤슈타인 거리 유사도 (0.0 ~ 1.0)
     */
    static levenshteinScore(s1, s2) {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        if (longer.length === 0) return 1.0;

        const costs = [];
        for (let i = 0; i <= longer.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= shorter.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) costs[shorter.length] = lastValue;
        }
        return (longer.length - costs[shorter.length]) / parseFloat(longer.length);
    }

    /**
     * 노드의 에러 상태를 초기화하고 캔버스를 완전히 새로고침하는 유틸리티
     */
    static clearNodeErrorsAndRefresh(nodes = []) {
        nodes.forEach(node => {
            if (!node) return;
            // 1. LiteGraph 노드 레벨 에러 플래그 제거
            node.has_errors = false;
            delete node.rendering_error;
            delete node.boxcolor;
            delete node.color;
            
            if (node.flags) {
                delete node.flags.has_errors;
                delete node.flags.error;
            }

            // 노드 개별 캔버스 재렌더링
            if (node.setDirtyCanvas) {
                node.setDirtyCanvas(true, true);
            }
        });

        // 2. 그래프 전체 변경 알림 및 캔버스 강제 재렌더링
        try {
            if (app.graph) {
                app.graph.afterChange?.();
                app.graph.change?.();
                app.graph.setDirtyCanvas?.(true, true);
            }
            if (app.canvas) {
                app.canvas.setDirty?.(true, true);
                app.canvas.draw?.(true, true);
            }
        } catch (e) {
            console.warn("[AutoModelAssigner] Error during canvas refresh:", e);
        }

        // 3. ComfyUI 최신 프론트엔드 에러 사이드바 / Validation 갱신 이벤트 트리거
        try {
            window.dispatchEvent(new CustomEvent("graphChanged"));
            window.dispatchEvent(new Event("resize"));
            
            // 사이드바의 에러 패널 새로고침 버튼(🔄)이 있으면 자동 클릭
            const refreshButtons = document.querySelectorAll("button i.pi-refresh, button i[class*='refresh'], button[aria-label*='refresh'], .p-button-icon.pi-refresh");
            refreshButtons.forEach(btn => {
                const parentBtn = btn.closest("button");
                if (parentBtn) {
                    parentBtn.click();
                }
            });
        } catch (e) {
            // silent ignore
        }
    }

    /**
     * 자동 장착 메인 실행 함수 (targetNode가 null이면 전체 워크플로우 대상)
     */
    static async runAutoAssign(targetNode = null) {
        this.showToast("🔍 모델 및 LoRA 분석 중...", "info");

        // 1. 로컬 모델 목록 로드
        let localModels = await this.fetchLocalModels();

        // 2. 대상 노드 목록 수집
        const nodesToScan = targetNode 
            ? [targetNode] 
            : (app.graph?._nodes || []);

        const itemsToResolve = [];
        let totalChecked = 0;
        let alreadyMatchedCount = 0;

        for (const node of nodesToScan) {
            if (!node.widgets) continue;

            for (const widget of node.widgets) {
                if (!this.isModelWidget(widget, node)) continue;
                totalChecked++;

                const category = this.detectCategory(widget, node);
                const currentValue = widget.value;

                // 로컬 모델 후보군 획득 (API 결과 또는 위젯 옵션)
                let availableList = (localModels && localModels[category]) || 
                                    (widget.options && Array.isArray(widget.options.values) ? widget.options.values : []);

                // 빈 문자열 및 None 필터링
                availableList = availableList.filter(f => typeof f === "string" && f.trim() !== "");

                if (availableList.length === 0) continue;

                // 이미 로컬에 정확히 존재하는 경우
                if (availableList.includes(currentValue)) {
                    alreadyMatchedCount++;
                    // 이미 정상이더라도 남아있던 에러 플래그 정리
                    node.has_errors = false;
                    delete node.boxcolor;
                    continue;
                }

                // 유사도 매칭 수행
                const scoredList = availableList.map(cand => ({
                    file: cand,
                    score: this.calculateSimilarity(currentValue, cand)
                })).sort((a, b) => b.score - a.score);

                const topMatch = scoredList[0];

                itemsToResolve.push({
                    node,
                    widget,
                    category,
                    currentValue: currentValue || "(설정 안됨)",
                    availableList,
                    recommendations: scoredList.slice(0, 4),
                    selectedMatch: topMatch ? topMatch.file : (availableList[0] || ""),
                    topScore: topMatch ? topMatch.score : 0,
                    isPerfectMatch: topMatch && topMatch.score === 100
                });
            }
        }

        if (totalChecked === 0) {
            this.showToast("캔버스에 모델 또는 LoRA 노드가 없습니다.", "warning");
            return;
        }

        if (itemsToResolve.length === 0) {
            this.clearNodeErrorsAndRefresh(nodesToScan);
            this.showToast(`✨ 모든 모델(${alreadyMatchedCount}개)이 이미 로컬 파일과 정확히 연결되어 있습니다!`, "success");
            return;
        }

        // 모든 미결 항목이 100% 매칭(파일명 동일, 경로만 다름 등)인 경우 -> 즉시 자동 적용!
        const allPerfect = itemsToResolve.every(item => item.isPerfectMatch);
        if (allPerfect) {
            let count = 0;
            const modifiedNodes = [];
            for (const item of itemsToResolve) {
                const oldValue = item.widget.value;
                item.widget.value = item.selectedMatch;
                if (item.widget.callback) {
                    item.widget.callback(item.selectedMatch, app.canvas, item.node, app.canvas.graph_mouse, {});
                }
                if (item.node.onWidgetChanged) {
                    item.node.onWidgetChanged(item.widget.name, item.selectedMatch, oldValue, item.widget);
                }
                modifiedNodes.push(item.node);
                count++;
            }
            this.clearNodeErrorsAndRefresh(modifiedNodes);
            this.showToast(`🎉 ${count}개 모델이 100% 자동 매칭되어 즉시 장착되었습니다!`, "success");
            return;
        }

        // 확인 및 사용자 선택이 필요한 경우 모달 다이얼로그 표시
        this.showResolverModal(itemsToResolve, alreadyMatchedCount);
    }

    /**
     * 스마트 모델 매핑 모달 UI 렌더링
     */
    static showResolverModal(items, alreadyMatchedCount) {
        // 기존 열린 모달 제거
        const existing = document.querySelector(".auto-assign-overlay");
        if (existing) existing.remove();

        const overlay = document.createElement("div");
        overlay.className = "auto-assign-overlay";

        const modal = document.createElement("div");
        modal.className = "auto-assign-modal";

        // 1. 헤더
        const header = document.createElement("div");
        header.className = "auto-assign-header";
        header.innerHTML = `
            <div class="auto-assign-title">
                <span class="icon">⚡</span>
                <span>모델 / LoRA 스마트 자동 장착</span>
            </div>
            <button class="auto-assign-close-btn" title="닫기">✕</button>
        `;
        header.querySelector(".auto-assign-close-btn").onclick = () => overlay.remove();

        // 2. 요약 바
        const summary = document.createElement("div");
        summary.className = "auto-assign-summary";
        summary.innerHTML = `
            <span>워크플로우 원본 모델을 내 PC 보유 모델로 매칭하거나 웹에서 검색할 수 있습니다.</span>
            <span class="badge badge-info">${items.length}개 노드 확인 필요</span>
        `;

        // 3. 바디 리스트
        const body = document.createElement("div");
        body.className = "auto-assign-body";

        items.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "auto-assign-item-card";

            const nodeTitle = item.node.title || item.node.type || `Node #${item.node.id}`;
            const cleanQuery = this.getCleanSearchQuery(item.currentValue);
            
            // 검색 링크 생성
            const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(cleanQuery + " safetensors")}`;
            const hfUrl = `https://huggingface.co/models?search=${encodeURIComponent(cleanQuery)}`;
            const civitaiUrl = `https://civitai.com/search/models?query=${encodeURIComponent(cleanQuery)}`;

            // 추천 버튼 렌더링
            let recsListHtml = "";
            if (item.recommendations && item.recommendations.length > 0) {
                recsListHtml = item.recommendations.map(r => {
                    const badgeClass = r.score >= 80 ? "high" : (r.score >= 40 ? "medium" : "low");
                    const isSelected = r.file === item.selectedMatch;
                    return `
                        <button type="button" class="auto-assign-rec-btn ${isSelected ? 'selected' : ''}" data-file="${escapeHtml(r.file)}">
                            <span class="auto-assign-match-badge ${badgeClass}">${r.score}%</span>
                            <span>${escapeHtml(r.file)}</span>
                        </button>
                    `;
                }).join("");
            }

            // 건너뛰기 버튼 추가
            const isSkipSelected = item.selectedMatch === SKIP_VALUE;
            const skipBtnHtml = `
                <button type="button" class="auto-assign-skip-btn ${isSkipSelected ? 'selected' : ''}" data-file="${SKIP_VALUE}">
                    <span>⏭️ 적용 안함 (건너뛰기)</span>
                </button>
            `;

            // 전체 드롭다운 옵션 렌더링 (첫 번째에 '건너뛰기' 옵션 제공)
            let optionsHtml = `<option value="${SKIP_VALUE}" ${isSkipSelected ? "selected" : ""}>⏭️ [건너뛰기] 변경하지 않고 원본 유지</option>`;
            optionsHtml += item.availableList.map(f => {
                const isSelected = f === item.selectedMatch;
                return `<option value="${escapeHtml(f)}" ${isSelected ? "selected" : ""}>${escapeHtml(f)}</option>`;
            }).join("");

            card.innerHTML = `
                <div class="auto-assign-item-header">
                    <div class="auto-assign-node-info">
                        <span>#${item.node.id} ${escapeHtml(nodeTitle)}</span>
                        <span class="auto-assign-cat-badge">${escapeHtml(item.category)}</span>
                    </div>
                </div>

                <div class="auto-assign-orig-wrapper">
                    <div class="auto-assign-orig-file">
                        <div class="auto-assign-orig-file-text">
                            <span>❌ 워크플로우 원본:</span> ${escapeHtml(item.currentValue)}
                        </div>
                        <div class="auto-assign-search-group">
                            <a href="${googleUrl}" target="_blank" rel="noopener noreferrer" class="auto-assign-search-btn google" title="구글에서 스마트 검색">
                                <span>🔍 구글 검색</span>
                            </a>
                            <a href="${hfUrl}" target="_blank" rel="noopener noreferrer" class="auto-assign-search-btn hf" title="HuggingFace에서 모델 검색">
                                <span>🤗 HuggingFace</span>
                            </a>
                            <a href="${civitaiUrl}" target="_blank" rel="noopener noreferrer" class="auto-assign-search-btn civitai" title="Civitai에서 모델 검색">
                                <span>💖 Civitai</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="auto-assign-recs-title">
                        <span>💡 추천 후보 (유사도 순)</span>
                    </div>
                    <div class="auto-assign-recs-list" id="recs-${index}">
                        ${recsListHtml}
                        ${skipBtnHtml}
                    </div>
                </div>

                <div class="auto-assign-select-wrapper">
                    <label>📂 내 PC 모델 직접 선택 또는 건너뛰기:</label>
                    <select class="auto-assign-select" id="select-${index}">
                        ${optionsHtml}
                    </select>
                </div>
            `;

            // 이벤트 바인딩 (추천 버튼 클릭 시 드롭다운 동기화)
            const selectElem = card.querySelector(`#select-${index}`);
            const updateSelection = (chosenFile) => {
                item.selectedMatch = chosenFile;
                selectElem.value = chosenFile;

                const allBtns = card.querySelectorAll(".auto-assign-rec-btn, .auto-assign-skip-btn");
                allBtns.forEach(b => {
                    b.classList.toggle("selected", b.dataset.file === chosenFile);
                });

                card.classList.toggle("skipped", chosenFile === SKIP_VALUE);
            };

            selectElem.addEventListener("change", (e) => {
                updateSelection(e.target.value);
            });

            const allBtns = card.querySelectorAll(".auto-assign-rec-btn, .auto-assign-skip-btn");
            allBtns.forEach(btn => {
                btn.addEventListener("click", () => {
                    updateSelection(btn.dataset.file);
                });
            });

            if (isSkipSelected) {
                card.classList.add("skipped");
            }

            body.appendChild(card);
        });

        // 4. 푸터
        const footer = document.createElement("div");
        footer.className = "auto-assign-footer";
        footer.innerHTML = `
            <div class="auto-assign-footer-left">
                <span>※ 건너뛴 노드는 기존 모델명이 그대로 유지됩니다.</span>
            </div>
            <div class="auto-assign-footer-right">
                <button class="auto-assign-btn auto-assign-btn-secondary" id="btn-cancel">취소</button>
                <button class="auto-assign-btn auto-assign-btn-primary" id="btn-apply">⚡ 선택한 모델 일괄 장착</button>
            </div>
        `;

        footer.querySelector("#btn-cancel").onclick = () => overlay.remove();
        footer.querySelector("#btn-apply").onclick = () => {
            let appliedCount = 0;
            let skippedCount = 0;
            const modifiedNodes = [];

            for (const item of items) {
                if (item.selectedMatch && item.selectedMatch !== SKIP_VALUE) {
                    const oldValue = item.widget.value;
                    item.widget.value = item.selectedMatch;
                    if (item.widget.callback) {
                        item.widget.callback(item.selectedMatch, app.canvas, item.node, app.canvas.graph_mouse, {});
                    }
                    if (item.node.onWidgetChanged) {
                        item.node.onWidgetChanged(item.widget.name, item.selectedMatch, oldValue, item.widget);
                    }
                    modifiedNodes.push(item.node);
                    appliedCount++;
                } else {
                    skippedCount++;
                }
            }
            
            // 에러 상태 클리어 및 캔버스 새로고침
            if (modifiedNodes.length > 0) {
                this.clearNodeErrorsAndRefresh(modifiedNodes);
            }

            overlay.remove();

            if (appliedCount > 0 && skippedCount > 0) {
                this.showToast(`🎉 ${appliedCount}개 모델 장착 완료 (⏭️ ${skippedCount}개 건너뜀)`, "success");
            } else if (appliedCount > 0) {
                this.showToast(`🎉 ${appliedCount}개 노드에 모델이 성공적으로 장착되었습니다!`, "success");
            } else {
                this.showToast(`⏭️ ${skippedCount}개 노드의 모델 변경을 건너뛰었습니다.`, "info");
            }
        };

        modal.appendChild(header);
        modal.appendChild(summary);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => overlay.classList.add("visible"));
    }

    /**
     * 토스트 알림창 표시
     */
    static showToast(message, type = "info") {
        let container = document.querySelector(".auto-assign-toast-container");
        if (!container) {
            container = document.createElement("div");
            container.className = "auto-assign-toast-container";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = `auto-assign-toast ${type}`;
        
        let icon = "⚡";
        if (type === "success") icon = "✅";
        if (type === "warning") icon = "⚠️";
        if (type === "error") icon = "❌";
        if (type === "info") icon = "ℹ️";

        toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px)";
            toast.style.transition = "all 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================
// 🚀 ComfyUI Extension 등록 및 메뉴 최하단 고정
// ==========================================
app.registerExtension({
    name: "ComfyUI.AutoModelAssigner",

    async setup() {
        console.log("[AutoModelAssigner] Initializing Context Menus at absolute bottom position...");

        // 1. 캔버스 빈 공간 우클릭 메뉴 훅
        const origGetCanvasMenuOptions = LGraphCanvas.prototype.getCanvasMenuOptions;
        LGraphCanvas.prototype.getCanvasMenuOptions = function () {
            const options = origGetCanvasMenuOptions ? origGetCanvasMenuOptions.apply(this, arguments) : [];
            
            options.push(null); // 구분선
            options.push({
                content: "⚡ 전체 모델/LoRA 자동 장착 (Auto-Assign All)",
                isAutoModelAssigner: true,
                callback: () => {
                    AutoModelAssigner.runAutoAssign(null);
                }
            });

            return options;
        };

        // 2. 개별 노드 우클릭 메뉴 훅
        const origGetNodeMenuOptions = LGraphCanvas.prototype.getNodeMenuOptions;
        LGraphCanvas.prototype.getNodeMenuOptions = function (node) {
            const options = origGetNodeMenuOptions ? origGetNodeMenuOptions.apply(this, arguments) : [];

            // 해당 노드가 모델 관련 위젯을 가지고 있는 경우에만 메뉴 추가
            if (AutoModelAssigner.isModelNode(node)) {
                options.push(null); // 구분선
                options.push({
                    content: "⚡ 이 노드 모델 자동 장착 (Auto-Assign)",
                    isAutoModelAssigner: true,
                    callback: () => {
                        AutoModelAssigner.runAutoAssign(node);
                    }
                });
            }

            return options;
        };

        // 3. 🛡️ LiteGraph.ContextMenu 생성자 가로채기 (다른 노드들이 덧붙인 뒤에도 항상 무조건 맨 아래로 이동)
        if (typeof LiteGraph !== "undefined" && LiteGraph.ContextMenu) {
            const origContextMenu = LiteGraph.ContextMenu;
            LiteGraph.ContextMenu = function (values, options) {
                if (Array.isArray(values)) {
                    // 우리 메뉴 항목 검색 (플래그 또는 텍스트 기반)
                    const targetIndex = values.findIndex(v => 
                        v && (
                            v.isAutoModelAssigner === true || 
                            (typeof v.content === "string" && (
                                v.content.includes("자동 장착") || 
                                v.content.includes("Auto-Assign")
                            ))
                        )
                    );

                    if (targetIndex !== -1) {
                        const [targetItem] = values.splice(targetIndex, 1);
                        
                        // 타겟 바로 앞의 null(구분선)이 고립되어 연속으로 남지 않도록 정리
                        if (targetIndex > 0 && values[targetIndex - 1] === null) {
                            if (targetIndex < values.length && values[targetIndex] === null) {
                                values.splice(targetIndex, 1);
                            }
                        }

                        // 맨 끝에 있는 연속 null 제거
                        while (values.length > 0 && values[values.length - 1] === null) {
                            values.pop();
                        }

                        // 항상 맨 아래에 구분선과 함께 추가!
                        values.push(null);
                        values.push(targetItem);
                    }
                }
                return new origContextMenu(values, options);
            };
            LiteGraph.ContextMenu.prototype = origContextMenu.prototype;
        }
    }
});
