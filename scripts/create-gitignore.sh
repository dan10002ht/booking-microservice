#!/bin/bash

# Script to create .gitignore files for all services

echo "🔧 Creating .gitignore files for all services..."

# List of Node.js services
nodejs_services=(
    "user-profile"
    "event-management"
    "booking-service"
    "payment-service"
    "ticket-service"
    "notification-service"
    "analytics-service"
    "pricing-service"
    "support-service"
    "invoice-service"
    "realtime-service"
    "email-worker"
    "checkin-service"
)

# List of Java services
java_services=(
    "rate-limiter"
)

# List of Go services
go_services=(
    "booking-worker"
)

# Create .gitignore for Node.js services
create_nodejs_gitignore() {
    local service=$1
    cat > "$service/.gitignore" << 'EOF'
# Dependencies
node_modules/

# Environment files
.env
.env.local
.env.development
.env.test
.env.production
.env.staging

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory
coverage/
*.lcov
.nyc_output
.coverage
coverage.json

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Build outputs
build/
dist/
out/

# Test outputs
test-results/

# Generated gRPC files
src/protos/generated/

# Docker
.dockerignore

# Local development files
.local/
local/

# Backup files
*.bak
*.backup
*.old

# Certificate files
*.pem
*.key
*.crt
*.csr

# Temporary files
*.tmp
*.temp
EOF
    echo "✅ Created .gitignore for $service"
}

# Create .gitignore for Java services
create_java_gitignore() {
    local service=$1
    cat > "$service/.gitignore" << 'EOF'
# Compiled class file
*.class

# Log file
*.log

# BlueJ files
*.ctxt

# Mobile Tools for Java (J2ME)
.mtj.tmp/

# Package Files #
*.jar
*.war
*.nar
*.ear
*.zip
*.tar.gz
*.rar

# virtual machine crash logs, see http://www.java.com/en/download/help/error_hotspot.xml
hs_err_pid*
replay_pid*

# Maven
target/
pom.xml.tag
pom.xml.releaseBackup
pom.xml.versionsBackup
pom.xml.next
release.properties
dependency-reduced-pom.xml
buildNumber.properties
.mvn/timing.properties
.mvn/wrapper/maven-wrapper.jar

# Gradle
.gradle
build/
!gradle/wrapper/gradle-wrapper.jar
!**/src/main/**/build/
!**/src/test/**/build/

# IntelliJ IDEA
.idea/
*.iws
*.iml
*.ipr
out/
!**/src/main/**/out/
!**/src/test/**/out/

# Eclipse
.apt_generated
.classpath
.factorypath
.project
.settings
.springBeans
.sts4-cache
bin/
!**/src/main/**/bin/
!**/src/test/**/bin/

# NetBeans
/nbproject/private/
/nbbuild/
/dist/
/nbdist/
/.nb-gradle/

# VS Code
.vscode/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Environment files
.env
.env.local
.env.development
.env.test
.env.production
.env.staging

# Application specific
application-local.yml
application-local.properties

# Docker
.dockerignore

# Temporary files
*.tmp
*.temp
EOF
    echo "✅ Created .gitignore for $service"
}

# Create .gitignore for Go services
create_go_gitignore() {
    local service=$1
    cat > "$service/.gitignore" << 'EOF'
# Binaries for programs and plugins
*.exe
*.exe~
*.dll
*.so
*.dylib

# Test binary, built with `go test -c`
*.test

# Output of the go coverage tool, specifically when used with LiteIDE
*.out

# Dependency directories (remove the comment below to include it)
# vendor/

# Go workspace file
go.work

# Build outputs
build/
dist/
bin/

# Environment files
.env
.env.local
.env.development
.env.test
.env.production
.env.staging

# Logs
*.log

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# Temporary folders
tmp/
temp/

# Docker
.dockerignore

# Local development files
.local/
local/

# Backup files
*.bak
*.backup
*.old

# Certificate files
*.pem
*.key
*.crt
*.csr

# Temporary files
*.tmp
*.temp
EOF
    echo "✅ Created .gitignore for $service"
}

# Create .gitignore for all Node.js services
echo "📦 Creating .gitignore for Node.js services..."
for service in "${nodejs_services[@]}"; do
    if [ -d "$service" ]; then
        create_nodejs_gitignore "$service"
    else
        echo "⚠️  Directory $service not found, skipping..."
    fi
done

# Create .gitignore for Java services
echo "☕ Creating .gitignore for Java services..."
for service in "${java_services[@]}"; do
    if [ -d "$service" ]; then
        create_java_gitignore "$service"
    else
        echo "⚠️  Directory $service not found, skipping..."
    fi
done

# Create .gitignore for Go services
echo "🐹 Creating .gitignore for Go services..."
for service in "${go_services[@]}"; do
    if [ -d "$service" ]; then
        create_go_gitignore "$service"
    else
        echo "⚠️  Directory $service not found, skipping..."
    fi
done

echo "🎉 All .gitignore files created successfully!"
echo ""
echo "📋 Summary:"
echo "   - Root project: .gitignore ✅"
echo "   - Gateway service: .gitignore ✅"
echo "   - Node.js services: ${#nodejs_services[@]} .gitignore files ✅"
echo "   - Java services: ${#java_services[@]} .gitignore files ✅"
echo "   - Go services: ${#go_services[@]} .gitignore files ✅" 