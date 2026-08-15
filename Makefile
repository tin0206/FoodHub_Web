# ==============================================================================
# VARIABLES
# ==============================================================================

# macOS usually has python3 only; Windows typically has python
ifeq ($(OS),Windows_NT)
PYTHON ?= python
else
PYTHON ?= python3
endif

GREEN  = \033[0;32m
YELLOW = \033[0;33m
RESET  = \033[0m

.PHONY: help deploy

# ==============================================================================
# HELP MENU (Default target)
# ==============================================================================

help:
	@echo ""
	@echo "FoodHub Web Management CLI:"
	@echo ""
	@echo "  Deploy:"
	@echo "    make deploy m=\"msg\"  - local npm i + build, commit/push, SSH Mac: pull + npm i + build + start"
	@echo ""

# ==============================================================================
# DEPLOY
# ==============================================================================

# Local npm i + build (fail fast), git commit/push, then SSH Mac:
# git pull && npm i && npm run build && npm run start
# Usage: make deploy m="your commit message"
deploy:
	$(PYTHON) scripts/deploy_to_server.py -m "$(m)"
