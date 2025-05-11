################
#BALANCED DESIGN
################
set.seed(1348) #LLN postcode because why not
marketing_data <- expand.grid(
  Brand   = factor(c("A", "B")),
  Faculty = factor(c("Arts", "Science")),
  rep     = 1:30
)

marketing_data$PreferenceScore <- with(marketing_data,
                                       5 +                                    #grand mean
                                         ifelse(Brand == "A", 0.5, -0.5) +      #Brand A vs. B effect
                                         ifelse(Faculty == "Science", 0.3, -0.3) +  #Science vs. Arts effect
                                         rnorm(nrow(marketing_data), sd = 1)    #individual variability
)

table(marketing_data$Brand, marketing_data$Faculty)
model <- aov(PreferenceScore ~ Brand * Faculty, data = marketing_data)
summary(model)

#########Additional tests for your assumptions################################## 

##Residual diagnostics plots
par(mfrow = c(2,2))
plot(model)  
#Residual vs fitted: No obvious funnel shape -> homoscedasticity looks reasonable
#Also look at the Scale-Location, you want a horizontal red line ith points evenly spread around it.
#QQ plot is reasonable, the tail is converging 
#This is your main plot that you want to test your assumptions in Anova, but you can supplement it by:

##Independence test (Durbin–Watson)
if (!require(lmtest)) install.packages("lmtest")
library(lmtest)
dwtest(model)
#No evidence of autocorrelation in residuals

##Inspect effects & interactions
aggregate(PreferenceScore ~ Brand + Faculty, data = marketing_data, mean)
with(marketing_data,
     interaction.plot(Brand, Faculty, PreferenceScore,
                      fun = mean, type = "b",
                      pch = c(19,17), leg.bty = "o",
                      xlab = "Brand", ylab = "Mean Preference Score",
                      trace.label = "Faculty"))
#the aggregate formula means “group the data by every combination of Brand and Faculty.”
#Lines are parallel, meaning no interaction, consistent with ANOVA.

##Effect sizes (partial η²)
if (!require(effectsize)) install.packages("effectsize")
library(effectsize)
eta_squared(model, partial = TRUE)
#Brand explains 29% of residual variance; Faculty explains 10%; interaction negligible.


##Compute Cohen's f from partial eta² of the interaction (or main effect)
if (!require(pwr)) install.packages("pwr")
library(pwr)
eta2_p <- eta_squared(model, partial = TRUE)$Eta2_partial[1]  # Brand’s η²ₚ
f       <- sqrt(eta2_p / (1 - eta2_p))
pwr.anova.test(k = 4, n = 30, f = f, sig.level = 0.05)
#With 30 participants per cell, the study is almost perfectly powered to detect the Brand effect.

##################
#UNBALANCED DESIGN
##################

set.seed(1348)

#Unbalanced design so unequal frequency of observations will be generated
ns <- c(A_Arts    = 20,
        A_Science = 40,
        B_Arts    = 30,
        B_Science = 50)

marketing_data <- rbind(
  data.frame(Brand = "A", Faculty = "Arts",    rep = 1:ns["A_Arts"]),
  data.frame(Brand = "A", Faculty = "Science", rep = 1:ns["A_Science"]),
  data.frame(Brand = "B", Faculty = "Arts",    rep = 1:ns["B_Arts"]),
  data.frame(Brand = "B", Faculty = "Science", rep = 1:ns["B_Science"])
)
marketing_data$Brand   <- factor(marketing_data$Brand)
marketing_data$Faculty <- factor(marketing_data$Faculty)

marketing_data$PreferenceScore <- with(marketing_data,
                                       5 +
                                         ifelse(Brand == "A",        0.5,  -0.5) +   # Brand effect
                                         ifelse(Faculty == "Science",0.3,  -0.3) +   # Faculty effect
                                         rnorm(nrow(marketing_data), sd = 1)          # noise
)

table(marketing_data$Brand, marketing_data$Faculty)

m1 <- aov(PreferenceScore ~ Brand + Faculty + Brand:Faculty, data = marketing_data)
summary(m1)

m1b <- aov(PreferenceScore ~ Faculty + Brand + Faculty:Brand, data = marketing_data)
summary(m1b)

lm2 <- lm(PreferenceScore ~ Brand * Faculty, data = marketing_data)
Anova(lm2, type = 2)

options(contrasts = c("contr.treatment", "contr.poly"))
Anova(lm2, type = 3)
