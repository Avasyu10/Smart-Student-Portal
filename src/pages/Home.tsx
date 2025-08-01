import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/home/Navbar';
import { Link } from 'react-router-dom';
import { GraduationCap, Brain, Clock, BarChart3, MessageSquare, Shield, CheckCircle, Users, FileText, Sparkles, Upload, MessageCircle, Target, Award } from 'lucide-react';
const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section id="hero" className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Violet Background Layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-purple-400/10 to-indigo-500/15"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-violet-600/5 via-transparent to-purple-500/10"></div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-violet-500/15 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(139, 69, 219, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.15) 0%, transparent 50%)`
        }}></div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          {/* Website Icon */}
          <div className="mb-8 animate-fade-in">
            <div className="p-6 bg-gradient-to-br from-violet-500/30 to-purple-600/20 backdrop-blur-sm rounded-3xl w-fit mx-auto border border-violet-300/40 shadow-2xl hover:shadow-violet-500/25 transition-all duration-500 hover:scale-105">
              <GraduationCap className="h-16 w-16 text-violet-700 drop-shadow-lg" />
            </div>
          </div>
          
          <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-5xl md:text-7xl font-bold text-violet-700 tracking-tight">
              <div className="leading-tight pb-2 drop-shadow-sm">Smart Student</div>
              <div className="leading-tight pt-6 drop-shadow-sm">Assignment Portal</div>
            </h1>
          </div>
          
          <Badge variant="secondary" className="mb-12 px-8 py-4 text-base font-semibold animate-fade-in backdrop-blur-sm bg-violet-500/20 border-violet-300/50 text-violet-800 shadow-lg hover:shadow-violet-500/30 transition-all duration-300 hover:scale-105" style={{ animationDelay: '0.2s' }}>
            <Sparkles className="h-5 w-5 mr-3 text-violet-600" />
            AI-Powered Education Platform
          </Badge>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
            A comprehensive platform where students upload assignments, communicate with teachers, 
            and receive AI-powered validation and proper grading for enhanced learning outcomes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Link to="/teacher-auth">
              <Button size="lg" className="px-10 py-6 text-lg font-semibold shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105">
                Access Portal
                <span className="ml-2">→</span>
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <div className="flex items-center gap-2 group">
              <CheckCircle className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-medium">Assignment Upload</span>
            </div>
            <div className="flex items-center gap-2 group">
              <CheckCircle className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-medium">Teacher-Student Chat</span>
            </div>
            <div className="flex items-center gap-2 group">
              <CheckCircle className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              <span className="font-medium">AI Validation & Grading</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-subtle">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-6 px-4 py-2">
              <Target className="h-4 w-4 mr-2" />
              Core Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Everything You Need for Success
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Powerful tools designed to enhance the learning experience for both students and teachers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Upload,
                title: "Assignment Upload",
                description: "Students can easily upload their assignments with support for multiple file formats and automatic organization by subject and deadline."
              },
              {
                icon: MessageCircle,
                title: "Teacher-Student Communication",
                description: "Real-time chat functionality allows seamless communication between teachers and students about assignments and coursework."
              },
              {
                icon: Brain,
                title: "AI Assignment Validation",
                description: "Advanced AI validates assignments for authenticity, quality, and adherence to requirements with instant feedback."
              },
              {
                icon: Award,
                title: "Comprehensive Grading",
                description: "Structured grading system with customizable rubrics and detailed feedback for continuous student improvement."
              },
              {
                icon: Clock,
                title: "Deadline Management",
                description: "Automatic deadline tracking and smart reminders to keep students and teachers organized and on schedule."
              },
              {
                icon: BarChart3,
                title: "Progress Analytics",
                description: "Detailed analytics and progress tracking to help monitor academic performance and identify areas for improvement."
              }
            ].map((feature, index) => (
              <Card key={index} className="border-border/50 shadow-card hover:shadow-glow transition-all duration-500 hover:scale-105 group animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader className="pb-4">
                  <div className="p-4 bg-primary/10 rounded-xl w-fit group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge variant="outline" className="mb-6 px-4 py-2">
              <Users className="h-4 w-4 mr-2" />
              Simple Process
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How The Platform Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Three simple steps to transform your assignment workflow and enhance learning outcomes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: Upload,
                number: "01",
                title: "Upload Assignment",
                description: "Students upload their completed assignments through the secure portal with automatic organization by subject and deadline tracking."
              },
              {
                icon: MessageCircle,
                number: "02", 
                title: "Communicate & Validate",
                description: "Real-time chat with teachers for clarifications while AI validates assignment authenticity and quality standards instantly."
              },
              {
                icon: Award,
                number: "03",
                title: "Receive Grading",
                description: "Teachers provide comprehensive grades and feedback using structured rubrics for consistent and fair assessment."
              }
            ].map((step, index) => (
              <div key={index} className="text-center group animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="relative mb-8">
                  <div className="p-8 bg-gradient-primary rounded-full w-fit mx-auto shadow-elegant group-hover:shadow-glow transition-all duration-300">
                    <step.icon className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
                    {step.number}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">{step.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Transforming Education Through Technology
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Experience the future of assignment management with our innovative platform designed for modern learning environments
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { number: "500+", label: "Assignments Processed", description: "Successfully managed and graded" },
              { number: "98%", label: "Student Satisfaction", description: "Students love our platform" },
              { number: "24/7", label: "Platform Availability", description: "Always accessible when you need it" }
            ].map((stat, index) => (
              <div key={index} className="text-center p-8 bg-white/70 backdrop-blur-sm rounded-2xl shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <h3 className="text-4xl md:text-5xl font-bold text-primary mb-3">{stat.number}</h3>
                <h4 className="text-lg font-semibold mb-2">{stat.label}</h4>
                <p className="text-muted-foreground">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-16 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="p-3 bg-primary/10 rounded-xl">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Smart Student Portal</h3>
                <p className="text-muted-foreground">AI-Powered Education Platform</p>
              </div>
            </div>
            <div className="text-muted-foreground">
              © 2024 Smart Student Portal. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default Home;
