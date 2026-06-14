# Base image for runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy project files and restore
COPY ["src/WorkForceManager.WebApi/WorkForceManager.WebApi.csproj", "src/WorkForceManager.WebApi/"]
COPY ["src/WorkForceManager.Infrastructure/WorkForceManager.Infrastructure.csproj", "src/WorkForceManager.Infrastructure/"]
COPY ["src/WorkForceManager.Application/WorkForceManager.Application.csproj", "src/WorkForceManager.Application/"]
COPY ["src/WorkForceManager.Domain/WorkForceManager.Domain.csproj", "src/WorkForceManager.Domain/"]

RUN dotnet restore "src/WorkForceManager.WebApi/WorkForceManager.WebApi.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/src/WorkForceManager.WebApi"
RUN dotnet build "WorkForceManager.WebApi.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Publish
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "WorkForceManager.WebApi.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Final stage
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "WorkForceManager.WebApi.dll"]
