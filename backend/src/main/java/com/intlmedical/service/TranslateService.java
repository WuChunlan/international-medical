package com.intlmedical.service;

import com.intlmedical.entity.SiteConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TranslateService {

    private final SiteConfigService siteConfigService;
    private final RestTemplate restTemplate;

    public String translate(String text) {
        if (text == null || text.isBlank()) return "";

        String provider = getConfigValue("translate_provider", "mymemory");
        String apiKey   = getConfigValue("translate_api_key", "");

        return switch (provider.toLowerCase()) {
            case "deepl" -> translateWithDeepl(text, apiKey);
            default      -> translateWithMyMemory(text, apiKey);
        };
    }

    // ── MyMemory ──────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private String translateWithMyMemory(String text, String apiKey) {
        String encoded = URLEncoder.encode(text, StandardCharsets.UTF_8);
        String url = "https://api.mymemory.translated.net/get?q=" + encoded + "&langpair=zh|en";
        if (!apiKey.isBlank()) {
            url += "&key=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8);
        }
        Map<String, Object> resp = restTemplate.getForObject(URI.create(url), Map.class);
        if (resp == null) throw new RuntimeException("MyMemory returned null");
        Map<String, Object> data = (Map<String, Object>) resp.get("responseData");
        if (data == null) throw new RuntimeException("MyMemory: no responseData");
        String translated = (String) data.get("translatedText");
        if (translated == null || translated.equals(text))
            throw new RuntimeException("MyMemory: no translation");
        return translated;
    }

    // ── DeepL ─────────────────────────────────────────────
    // DeepL Free: api-free.deepl.com  |  DeepL Pro: api.deepl.com
    @SuppressWarnings("unchecked")
    private String translateWithDeepl(String text, String apiKey) {
        if (apiKey.isBlank()) throw new RuntimeException("DeepL API key is not configured");

        // Free keys end with ":fx"
        String host = apiKey.endsWith(":fx")
            ? "https://api-free.deepl.com"
            : "https://api.deepl.com";

        String url = host + "/v2/translate"
            + "?auth_key=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8)
            + "&text=" + URLEncoder.encode(text, StandardCharsets.UTF_8)
            + "&source_lang=ZH"
            + "&target_lang=EN";

        Map<String, Object> resp = restTemplate.getForObject(URI.create(url), Map.class);
        if (resp == null) throw new RuntimeException("DeepL returned null");
        List<Map<String, Object>> translations = (List<Map<String, Object>>) resp.get("translations");
        if (translations == null || translations.isEmpty())
            throw new RuntimeException("DeepL: no translations");
        return (String) translations.get(0).get("text");
    }

    private String getConfigValue(String key, String defaultValue) {
        SiteConfig cfg = siteConfigService.getByKey(key);
        if (cfg == null) return defaultValue;
        String v = cfg.getValueEn();
        return (v != null && !v.isBlank()) ? v : defaultValue;
    }
}
