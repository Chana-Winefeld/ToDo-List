FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG configuration=Release
WORKDIR /src

# העתקת קובץ הפרויקט מהתיקייה הנוכחית
COPY ["TodoApi.csproj", "."]
RUN dotnet restore "TodoApi.csproj"

# העתקת כל שאר הקבצים
COPY . .
RUN dotnet build "TodoApi.csproj" -c $configuration -o /app/build

FROM build AS publish
RUN dotnet publish "TodoApi.csproj" -c $configuration -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "TodoApi.dll"]