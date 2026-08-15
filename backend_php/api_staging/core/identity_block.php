<?php
// Centralized Identity Normalization and Blocklist Helper

function normalizeIdentityEmail($email) {
    return trim(strtolower((string)$email));
}

function normalizeIdentityPhone($phone) {
    $p = preg_replace('/[^\+0-9]/', '', (string)$phone);
    if (strpos($p, '00') === 0) {
        $p = '+' . substr($p, 2);
    }
    if ($p !== '' && strpos($p, '+') !== 0) {
        $p = '+' . $p;
    }
    return $p;
}

function isIdentityBlocked($conn, $email, $phone) {
    $normEmail = normalizeIdentityEmail($email);
    $normPhone = normalizeIdentityPhone($phone);

    $stmt = $conn->prepare("SELECT id, identifier_type, identifier_value, normalized_value, reason FROM blocked_identities WHERE (identifier_type = 'email' AND normalized_value = ?) OR (identifier_type = 'phone' AND normalized_value = ?) LIMIT 1");
    $stmt->execute([$normEmail, $normPhone]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function isSingleIdentifierBlocked($conn, $identifier) {
    $normEmail = normalizeIdentityEmail($identifier);
    $normPhone = normalizeIdentityPhone($identifier);

    $stmt = $conn->prepare("SELECT id, identifier_type, identifier_value, normalized_value, reason FROM blocked_identities WHERE (identifier_type = 'email' AND normalized_value = ?) OR (identifier_type = 'phone' AND normalized_value = ?) LIMIT 1");
    $stmt->execute([$normEmail, $normPhone]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}
