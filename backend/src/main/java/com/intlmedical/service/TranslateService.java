package com.intlmedical.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.intlmedical.entity.SiteConfig;
import com.intlmedical.mapper.SiteConfigMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
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

    private final SiteConfigMapper siteConfigMapper;
    private final RestTemplate restTemplate;

    /** 翻译到英文（兼容旧调用方） */
    public String translate(String text) {
        return translate(text, "en");
    }

    /** 翻译到指定语言，targetLang 为 ISO 639-1 小写代码，如 en/fr/es/de */
    public String translate(String text, String targetLang) {
        if (text == null || text.isBlank()) return "";
        if (targetLang == null || targetLang.isBlank()) targetLang = "en";

        String provider = getConfigValue("translate_provider", "mymemory");
        String apiKey   = getConfigValue("translate_api_key", "");

        return switch (provider.toLowerCase()) {
            case "deepl"    -> translateWithDeepl(text, apiKey, targetLang);
            case "deepseek" -> translateWithDeepSeek(text, apiKey, targetLang);
            default         -> translateWithMyMemory(text, apiKey, targetLang);
        };
    }

    // ── MyMemory ──────────────────────────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private String translateWithMyMemory(String text, String apiKey, String targetLang) {
        String encoded = URLEncoder.encode(text, StandardCharsets.UTF_8);
        String url = "https://api.mymemory.translated.net/get?q=" + encoded + "&langpair=zh|" + targetLang;
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

    // ── DeepL ─────────────────────────────────────────────────────────────────
    // DeepL v2 requires POST + Authorization header (not GET + auth_key param)
    // Free key ends with ":fx" → api-free.deepl.com; Pro → api.deepl.com
    @SuppressWarnings("unchecked")
    private String translateWithDeepl(String text, String apiKey, String targetLang) {
        if (apiKey.isBlank()) throw new RuntimeException("DeepL API key is not configured");

        String host = apiKey.endsWith(":fx")
            ? "https://api-free.deepl.com"
            : "https://api.deepl.com";

        // DeepL uses EN-US/EN-GB style for English; others are plain 2-letter uppercase
        String deeplTarget = normalizeDeeplLang(targetLang);

        String body = "text=" + URLEncoder.encode(text, StandardCharsets.UTF_8)
            + "&source_lang=ZH"
            + "&target_lang=" + deeplTarget;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "DeepL-Auth-Key " + apiKey);

        HttpEntity<String> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
            host + "/v2/translate", HttpMethod.POST, request,
            new org.springframework.core.ParameterizedTypeReference<>() {}
        );

        Map<String, Object> resp = response.getBody();
        if (resp == null) throw new RuntimeException("DeepL returned null");
        List<Map<String, Object>> translations = (List<Map<String, Object>>) resp.get("translations");
        if (translations == null || translations.isEmpty())
            throw new RuntimeException("DeepL: no translations in response");
        String result = (String) translations.get(0).get("text");
        if (result == null || result.isBlank()) throw new RuntimeException("DeepL: empty translation");
        return result;
    }

    /** DeepSeek 翻译 (OpenAI-compatible chat completions API) */
    @SuppressWarnings("unchecked")
    private String translateWithDeepSeek(String text, String apiKey, String targetLang) {
        if (apiKey.isBlank()) throw new RuntimeException("DeepSeek API key is not configured");

        String langName = switch (targetLang.toLowerCase()) {
            case "en" -> "English";
            case "fr" -> "French";
            case "es" -> "Spanish";
            case "de" -> "German";
            case "ja" -> "Japanese";
            case "ko" -> "Korean";
            case "ar" -> "Arabic";
            case "pt" -> "Portuguese";
            case "ru" -> "Russian";
            case "zh-tw" -> "Traditional Chinese (繁體中文)";
            default   -> targetLang;
        };

        Map<String, Object> body = Map.of(
            "model", "deepseek-chat",
            "temperature", 0.1,
            "messages", List.of(
                Map.of("role", "system",
                       "content", "You are a professional medical translator. Translate the following Chinese text to "
                           + langName + ". Output ONLY the translation — no explanations, no extra text."),
                Map.of("role", "user", "content", text)
            )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
            "https://api.deepseek.com/chat/completions", HttpMethod.POST, request,
            new org.springframework.core.ParameterizedTypeReference<>() {}
        );

        Map<String, Object> resp = response.getBody();
        if (resp == null) throw new RuntimeException("DeepSeek returned null");
        List<Map<String, Object>> choices = (List<Map<String, Object>>) resp.get("choices");
        if (choices == null || choices.isEmpty()) throw new RuntimeException("DeepSeek: no choices in response");
        Map<String, Object> msg = (Map<String, Object>) choices.get(0).get("message");
        if (msg == null) throw new RuntimeException("DeepSeek: no message in choice");
        String result = (String) msg.get("content");
        if (result == null || result.isBlank()) throw new RuntimeException("DeepSeek: empty translation");
        return result.trim();
    }

    /** DeepL 对英语需要区域码，其余语种直接大写即可 */
    private static String normalizeDeeplLang(String lang) {
        return switch (lang.toLowerCase()) {
            case "en" -> "EN-US";
            case "pt" -> "PT-PT";
            case "zh-tw" -> "ZH-HANT";
            default   -> lang.toUpperCase();
        };
    }

    private String getConfigValue(String key, String defaultValue) {
        SiteConfig cfg = siteConfigMapper.selectOne(
            new LambdaQueryWrapper<SiteConfig>().eq(SiteConfig::getConfigKey, key)
        );
        if (cfg == null) return defaultValue;
        String v = cfg.getValueEn();
        return (v != null && !v.isBlank()) ? v : defaultValue;
    }
}

